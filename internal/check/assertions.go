package check

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"net/url"
	"reflect"
	"strconv"
	"strings"
)

const maxResponseBytes = 1 << 20

// Assertion uses RFC 6901 JSON pointers. allEqual traverses exactly one array
// with a /* segment and fails on empty arrays (use equals [] to assert emptiness).
type Assertion struct {
	Path     string          `json:"path"`
	Operator string          `json:"operator"`
	Value    json.RawMessage `json:"value,omitempty"`
}
type AssertionResult struct {
	Path     string `json:"path"`
	Operator string `json:"operator"`
	Passed   bool   `json:"passed"`
}
type StateCheck struct {
	Path       string `json:"path"`
	Pointer    string `json:"pointer"`
	IdentityID string `json:"identityId,omitempty"`
	Token      string `json:"-"`
}

func ValidPath(path string) bool {
	u, err := url.Parse(path)
	if err != nil || !strings.HasPrefix(path, "/") || strings.HasPrefix(path, "//") || u.IsAbs() || u.Host != "" || u.Fragment != "" || strings.ContainsAny(path, "\\\r\n") {
		return false
	}
	for _, segment := range strings.Split(u.Path, "/") {
		if segment == ".." || segment == "." {
			return false
		}
	}
	return true
}

func Validate(c Case) error {
	if c.Want < 200 || c.Want > 599 {
		return errors.New("expected status must be between 200 and 599")
	}
	if !ValidPath(c.Path) {
		return errors.New("request path must be a relative API path without traversal")
	}
	switch c.Method {
	case "", "GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS":
	default:
		return errors.New("unsupported HTTP method")
	}
	if len(c.RequestBody) > 65536 || (c.RequestBody != "" && !json.Valid([]byte(c.RequestBody))) {
		return errors.New("request body must be JSON of at most 64 KiB")
	}
	for k, v := range c.Headers {
		if sensitive(k) || strings.ContainsAny(k+v, "\r\n") || strings.EqualFold(k, "Host") {
			return errors.New("credential or invalid request header; use an identity credential reference")
		}
	}
	if len(c.Assertions) > 32 {
		return errors.New("at most 32 assertions per check")
	}
	for _, a := range c.Assertions {
		if !validPointer(a.Path) {
			return errors.New("assertion path must be a JSON pointer")
		}
		switch a.Operator {
		case "equals", "allEqual":
			if !json.Valid(a.Value) {
				return errors.New("assertion value must be JSON")
			}
		case "absent", "exists":
		default:
			return errors.New("unsupported assertion operator")
		}
		if a.Operator == "allEqual" && wildcardCount(a.Path) != 1 {
			return errors.New("allEqual requires one /* array segment")
		}
	}
	if c.State != nil && (!ValidPath(c.State.Path) || !validPointer(c.State.Pointer)) {
		return errors.New("invalid state observation path or pointer")
	}
	return nil
}

func validPointer(path string) bool {
	if path != "" && !strings.HasPrefix(path, "/") {
		return false
	}
	for i := 0; i < len(path); i++ {
		if path[i] == '~' {
			if i+1 >= len(path) || (path[i+1] != '0' && path[i+1] != '1') {
				return false
			}
			i++
		}
	}
	return true
}
func wildcardCount(path string) int {
	count := 0
	for _, part := range strings.Split(path, "/") {
		if part == "*" {
			count++
		}
	}
	return count
}

// Compare JSON numbers by value without losing integer precision to float64.
func equalJSON(a, b any) bool {
	if an, ok := a.(json.Number); ok {
		bn, ok := b.(json.Number)
		if !ok {
			return false
		}
		ar, aok := new(big.Rat).SetString(string(an))
		br, bok := new(big.Rat).SetString(string(bn))
		return aok && bok && ar.Cmp(br) == 0
	}
	switch av := a.(type) {
	case []any:
		bv, ok := b.([]any)
		if !ok || len(av) != len(bv) {
			return false
		}
		for i := range av {
			if !equalJSON(av[i], bv[i]) {
				return false
			}
		}
		return true
	case map[string]any:
		bv, ok := b.(map[string]any)
		if !ok || len(av) != len(bv) {
			return false
		}
		for k, v := range av {
			x, exists := bv[k]
			if !exists || !equalJSON(v, x) {
				return false
			}
		}
		return true
	default:
		return reflect.DeepEqual(a, b)
	}
}

func decode(body []byte) (any, error) {
	var v any
	d := json.NewDecoder(bytes.NewReader(body))
	d.UseNumber()
	if err := d.Decode(&v); err != nil {
		return nil, err
	}
	if err := d.Decode(new(any)); err != io.EOF {
		return nil, errors.New("trailing JSON content")
	}
	return v, nil
}
func pointer(v any, path string) (any, bool) {
	if path == "" {
		return v, true
	}
	if !strings.HasPrefix(path, "/") {
		return nil, false
	}
	for _, part := range strings.Split(path[1:], "/") {
		part = strings.ReplaceAll(strings.ReplaceAll(part, "~1", "/"), "~0", "~")
		switch node := v.(type) {
		case map[string]any:
			var ok bool
			v, ok = node[part]
			if !ok {
				return nil, false
			}
		case []any:
			n, err := strconv.Atoi(part)
			if err != nil || n < 0 || n >= len(node) || strconv.Itoa(n) != part {
				return nil, false
			}
			v = node[n]
		default:
			return nil, false
		}
	}
	return v, true
}
func evaluate(body []byte, a Assertion) AssertionResult {
	r := AssertionResult{Path: a.Path, Operator: a.Operator}
	v, err := decode(body)
	if err != nil {
		return r
	}
	expected, _ := decode(a.Value)
	if a.Operator == "allEqual" {
		prefix, suffix, ok := strings.Cut(a.Path, "/*")
		if !ok {
			return r
		}
		arr, ok := pointer(v, prefix)
		if !ok {
			return r
		}
		items, ok := arr.([]any)
		if !ok || len(items) == 0 {
			return r
		}
		for _, item := range items {
			got, exists := pointer(item, suffix)
			if !exists || !equalJSON(got, expected) {
				return r
			}
		}
		r.Passed = true
		return r
	}
	got, exists := pointer(v, a.Path)
	switch a.Operator {
	case "equals":
		r.Passed = exists && equalJSON(got, expected)
	case "absent":
		r.Passed = !exists
	case "exists":
		r.Passed = exists
	}
	return r
}
func observe(ctx context.Context, client *http.Client, base string, s *StateCheck) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", base+s.Path, nil)
	if err != nil {
		return nil, err
	}
	if s.Token != "" {
		req.Header.Set("Authorization", "Bearer "+s.Token)
	}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("observation returned %d", resp.StatusCode)
	}
	body, err := io.ReadAll(io.LimitReader(resp.Body, maxResponseBytes+1))
	if err != nil || len(body) > maxResponseBytes {
		return nil, errors.New("incomplete observation")
	}
	v, err := decode(body)
	if err != nil {
		return nil, err
	}
	if _, ok := pointer(v, s.Pointer); !ok {
		return nil, errors.New("state pointer absent")
	}
	return body, nil
}
func sameState(before, after []byte, path string) bool {
	b, err := decode(before)
	if err != nil {
		return false
	}
	a, err := decode(after)
	if err != nil {
		return false
	}
	bv, bok := pointer(b, path)
	av, aok := pointer(a, path)
	return bok && aok && equalJSON(bv, av)
}
func sensitive(key string) bool {
	key = strings.ToLower(strings.NewReplacer("-", "", "_", "", ".", "").Replace(key))
	return strings.Contains(key, "password") || strings.Contains(key, "secret") || strings.Contains(key, "token") || strings.Contains(key, "apikey") || strings.Contains(key, "authorization") || strings.Contains(key, "cookie")
}
func scrub(v any) bool {
	changed := false
	switch n := v.(type) {
	case map[string]any:
		for k, x := range n {
			if sensitive(k) {
				n[k] = "[REDACTED]"
				changed = true
			} else {
				changed = scrub(x) || changed
			}
		}
	case []any:
		for _, x := range n {
			changed = scrub(x) || changed
		}
	}
	return changed
}
func evidence(body []byte, secrets ...string) (string, bool) {
	if len(body) == 0 {
		return "", false
	}
	v, err := decode(body)
	if err != nil {
		return "[Non-JSON or incomplete response omitted]", true
	}
	redacted := scrub(v)
	raw, _ := json.Marshal(v)
	out := string(raw)
	for _, secret := range secrets {
		encoded, _ := json.Marshal(secret)
		escaped := string(encoded[1 : len(encoded)-1])
		if secret != "" && strings.Contains(out, escaped) {
			out = strings.ReplaceAll(out, escaped, "[REDACTED]")
			redacted = true
		}
	}
	if len(out) > maxEvidenceBodyBytes {
		out = out[:maxEvidenceBodyBytes] + "… [truncated]"
	}
	return out, redacted
}
func stateToken(c Case) string {
	if c.State != nil {
		return c.State.Token
	}
	return ""
}
func safeCase(c Case) Case {
	c.Token = ""
	c.RedactionSecrets = nil
	if c.State != nil {
		s := *c.State
		s.Token = ""
		c.State = &s
	}
	if c.RequestBody != "" {
		c.RequestBody = "[Request body omitted from evidence]"
	}
	h := map[string]string{}
	for k, v := range c.Headers {
		if sensitive(k) {
			h[k] = "[REDACTED]"
		} else {
			h[k] = v
		}
	}
	c.Headers = h
	if u, err := url.Parse(c.Path); err == nil {
		q := u.Query()
		for k := range q {
			if sensitive(k) {
				q.Set(k, "[REDACTED]")
			}
		}
		u.RawQuery = q.Encode()
		c.Path = u.String()
	}
	return c
}
