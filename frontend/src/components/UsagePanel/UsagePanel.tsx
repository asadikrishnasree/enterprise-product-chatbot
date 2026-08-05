import {
    Divider,
    LinearProgress,
    Stack,
    Typography,
  } from "@mui/material";
  
  import { useAppSelector } from "../../redux/hooks";
  
  function UsagePanel() {
    const {
      totalInputTokens,
      totalOutputTokens,
      totalCost,
      contextWindowSize,
    } = useAppSelector((state) => state.usage);
  
    const totalTokens =
      totalInputTokens + totalOutputTokens;
  
    const contextUsagePercentage =
      contextWindowSize > 0
        ? Math.min(
            (totalTokens / contextWindowSize) * 100,
            100,
          )
        : 0;
  
    return (
      <Stack spacing={1.5}>
        <Typography
  variant="subtitle1"
  sx={{ fontWeight: 600 }}
>
          Session Usage
        </Typography>
  
        <Divider />
  
        <Stack spacing={0.5}>
          <Typography variant="body2">
            Input tokens: {totalInputTokens}
          </Typography>
  
          <Typography variant="body2">
            Output tokens: {totalOutputTokens}
          </Typography>
  
          <Typography variant="body2">
            Estimated cost: ${totalCost.toFixed(4)}
          </Typography>
        </Stack>
  
        <Stack spacing={0.75}>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Context window:{" "}
            {contextUsagePercentage.toFixed(1)}%
          </Typography>
  
          <LinearProgress
            variant="determinate"
            value={contextUsagePercentage}
          />
        </Stack>
      </Stack>
    );
  }
  
  export default UsagePanel;