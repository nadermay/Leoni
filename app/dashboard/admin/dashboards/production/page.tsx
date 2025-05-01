import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProductionDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Production KPIs Dashboard</h1>
        <p className="text-muted-foreground">
          This is a placeholder for the Power BI Production KPIs Dashboard integration.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Power BI Integration</CardTitle>
          <CardDescription>This dashboard will be connected to Power BI in the future.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              The Power BI dashboard will be embedded here. This is a placeholder for future integration.
            </p>
            <div className="h-[400px] w-full bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Production KPIs Dashboard Placeholder</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
