param(
  [Parameter(Mandatory=$true)][string]$PilotProjectId,
  [Parameter(Mandatory=$true)][string]$NarrationProjectId,
  [Parameter(Mandatory=$true)][string]$NotificationChannel,
  [Parameter(Mandatory=$true)][string]$BillingAccount,
  [Parameter(Mandatory=$true)][decimal]$MonthlyBudget,
  [string]$Currency = 'USD'
)
$ErrorActionPreference = 'Stop'
if ($PilotProjectId -eq $NarrationProjectId) { throw 'Pilot and narration projects must be separate.' }
if ($MonthlyBudget -le 0) { throw 'Supply the operator-approved monthly budget.' }
if (-not $NotificationChannel.StartsWith("projects/$PilotProjectId/notificationChannels/")) { throw 'Notification channel must belong to the pilot project.' }
$policy = @{
  displayName = 'Olamia pilot server failures'
  combiner = 'OR'
  enabled = $true
  notificationChannels = @($NotificationChannel)
  conditions = @(@{
    displayName = 'Cloud Functions v2 server errors'
    conditionThreshold = @{
      filter = 'resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/request_count" AND metric.labels.response_code_class="5xx"'
      comparison = 'COMPARISON_GT'
      thresholdValue = 0
      duration = '60s'
      aggregations = @(@{ alignmentPeriod = '60s'; perSeriesAligner = 'ALIGN_RATE'; crossSeriesReducer = 'REDUCE_SUM' })
      trigger = @{ count = 1 }
    }
  })
  documentation = @{ mimeType = 'text/markdown'; content = 'Investigate pilot account/sync failures. Preserve pending classroom outboxes. Never copy request payloads or child names into incident reports.' }
}
$policyFile = [System.IO.Path]::GetTempFileName()
try {
  $policy | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $policyFile -Encoding utf8
  gcloud monitoring policies create --project=$PilotProjectId --policy-from-file=$policyFile
  if ($LASTEXITCODE -ne 0) { throw 'Monitoring policy was not created.' }
  $projectNumber = gcloud projects describe $PilotProjectId --format='value(projectNumber)'
  if ($LASTEXITCODE -ne 0) { throw 'Could not resolve project number.' }
  $amount = $MonthlyBudget.ToString([System.Globalization.CultureInfo]::InvariantCulture) + $Currency
  gcloud billing budgets create --billing-account=$BillingAccount --display-name='Olamia pilot monthly budget' --budget-amount=$amount --filter-projects="projects/$projectNumber" --threshold-rule='percent=0.5,basis=current-spend' --threshold-rule='percent=0.9,basis=current-spend' --threshold-rule='percent=1,basis=current-spend' --notifications-rule-monitoring-notification-channels=$NotificationChannel
  if ($LASTEXITCODE -ne 0) { throw 'Budget alerts were not created; keep the release gate closed.' }
} finally { Remove-Item -LiteralPath $policyFile -ErrorAction SilentlyContinue }
