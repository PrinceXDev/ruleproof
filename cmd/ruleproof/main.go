package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"net/http/httptest"
	"os"
	"ruleproof/internal/check"
	"ruleproof/internal/demo"
)

func main() {
	mode := flag.String("mode", "broken", "demo API: broken or fixed")
	flag.Parse()
	if *mode != "broken" && *mode != "fixed" {
		fmt.Fprintln(os.Stderr, "mode must be broken or fixed")
		os.Exit(2)
	}
	server := httptest.NewServer(demo.Handler(*mode == "broken"))
	results := check.Run(context.Background(), server.URL, demo.Matrix())
	server.Close()
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	if err := enc.Encode(results); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(2)
	}
	for _, result := range results {
		if result.Verdict != "pass" {
			os.Exit(1)
		}
	}
}
