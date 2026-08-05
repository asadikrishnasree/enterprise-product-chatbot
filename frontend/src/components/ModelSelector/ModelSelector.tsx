import {
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Typography,
  } from "@mui/material";
  import type { SelectChangeEvent } from "@mui/material/Select";
  
  import { useAppDispatch, useAppSelector } from "../../redux/hooks";
  import {
    setSelectedModel,
  } from "../../redux/slices/modelSlice";
  import type {
    ModelProvider,
  } from "../../redux/slices/modelSlice";
  
  function ModelSelector() {
    const dispatch = useAppDispatch();
  
    const {
      selectedModel,
      availableModels,
    } = useAppSelector((state) => state.model);
  
    const selectedModelDetails =
      availableModels.find(
        (model) => model.id === selectedModel,
      );
  
    const handleChange = (
      event: SelectChangeEvent<ModelProvider>,
    ) => {
      dispatch(
        setSelectedModel(
          event.target.value as ModelProvider,
        ),
      );
    };
  
    return (
      <Stack spacing={1.5}>
        <FormControl fullWidth size="small">
          <InputLabel id="model-selector-label">
            AI Model
          </InputLabel>
  
          <Select<ModelProvider>
            labelId="model-selector-label"
            value={selectedModel}
            label="AI Model"
            onChange={handleChange}
          >
            {availableModels.map((model) => (
              <MenuItem
                key={model.id}
                value={model.id}
              >
                {model.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
  
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {selectedModelDetails?.description}
        </Typography>
      </Stack>
    );
  }
  
  export default ModelSelector;