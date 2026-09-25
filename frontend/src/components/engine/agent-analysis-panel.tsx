import { BrainCircuit, FlaskConical, ShieldQuestion } from "lucide-react";
import { AgentAnalysis } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VerdictBadge } from "@/components/engine/verdict-badge";

export function AgentAnalysisPanel({ analysis }: { analysis: AgentAnalysis }) {
  const { synthesis_result, hypothesis_result, critique_result } = analysis;

  return (
    <div className="space-y-4">
      {synthesis_result && (
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <BrainCircuit className="h-4 w-4" /> Synthesis Agent
            </CardTitle>
            <VerdictBadge verdict={synthesis_result.verdict} />
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm leading-relaxed">{synthesis_result.reasoning}</p>
            {synthesis_result.matched_sources?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {synthesis_result.matched_sources.map((s, i) => (
                  <Badge key={i} variant="secondary" className="text-xs font-normal">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {hypothesis_result && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FlaskConical className="h-4 w-4" /> Hypothesis Agent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed">{hypothesis_result.hypothesis}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {hypothesis_result.physical_reasoning}
            </p>
            {hypothesis_result.next_checks?.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Next checks
                </p>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  {hypothesis_result.next_checks.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {critique_result && (
        <Card className="border-border/60 bg-accent/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ShieldQuestion className="h-4 w-4" /> Critique Agent (independent review)
            </CardTitle>
            <Badge variant={critique_result.agrees_with_pipeline ? "secondary" : "destructive"}>
              {critique_result.agrees_with_pipeline ? "Agrees" : "Disagrees"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm leading-relaxed">{critique_result.critique}</p>
            {critique_result.alternative_explanation && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">Alternative explanation: </span>
                {critique_result.alternative_explanation}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
