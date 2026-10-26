import Badge from "../Badge";

const PolicyBadge = ({ label }: { label: string }) => (
  <Badge tone={label === "allow" ? "pass" : "neutral"}>
    {label === "allow" ? "Allow" : "Deny"}
  </Badge>
);

export default PolicyBadge;
