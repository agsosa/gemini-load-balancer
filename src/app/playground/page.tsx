'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  Flex,
  Button,
  Textarea,
  Select,
  FormControl,
  FormLabel,
  Switch,
  Code,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  IconButton,
  Tooltip,
  Badge,
  useToast,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { FiSend, FiSave, FiCopy, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import Sidebar from '@/components/layout/Sidebar';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface PlaygroundState {
  messages: Message[];
  model: string;
  temperature: number;
  maxTokens: number;
  stream: boolean;
}

const DEFAULT_STATE: PlaygroundState = {
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello, how can you help me today?' }
  ],
  model: 'gemini-1.5-pro',
  temperature: 0.7,
  maxTokens: 8192,
  stream: true
};

export default function PlaygroundPage() {
  const [state, setState] = useState<PlaygroundState>(DEFAULT_STATE);
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.0-pro'
  ]);
  const [savedStates, setSavedStates] = useState<{ name: string; state: PlaygroundState }[]>([]);
  const [stateName, setStateName] = useState('');
  
  const responseRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Use a ref to prevent duplicate fetches in development mode
  const fetchedModelsRef = useRef(false);

  useEffect(() => {
    // Load saved states from localStorage
    const saved = localStorage.getItem('playground-saved-states');
    if (saved) {
      try {
        setSavedStates(JSON.parse(saved));
      } catch (err) {
        console.error('Error loading saved states:', err);
      }
    }
    
    // Fetch available models only once
    if (!fetchedModelsRef.current) {
      fetchModels();
      fetchedModelsRef.current = true;
    }
  }, []);

  const fetchModels = async () => {
    setIsLoadingModels(true);
    setModelError(null);
    try {
      const response = await fetch('/api/v1/models');
      if (!response.ok) {
        throw new Error(`Error fetching models: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Check if we have the expected data structure
      if (data.data && Array.isArray(data.data)) {
        const modelIds = data.data
          .filter((model: any) => model.id && model.id.includes('gemini'))
          .map((model: any) => model.id);
        
        if (modelIds.length > 0) {
          setAvailableModels(modelIds);
          // Update the current model if it's not in the list
          if (!modelIds.includes(state.model)) {
            setState(prev => ({ ...prev, model: modelIds[0] }));
          }
          toast({
            title: 'Models Loaded',
            description: `Loaded ${modelIds.length} Gemini models`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        } else {
          throw new Error('No Gemini models found in the API response');
        }
      } else {
        // Handle the case where the response doesn't have the expected structure
        throw new Error('Invalid response format from models API');
      }
    } catch (err: any) {
      console.error('Error fetching models:', err);
      setModelError(err.message || 'Failed to fetch models');
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch models',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setResponse('');
    
    try {
      const requestBody = {
        model: state.model,
        messages: state.messages,
        temperature: state.temperature,
        max_tokens: state.maxTokens,
        stream: state.stream
      };
      
      if (state.stream) {
        // Handle streaming response
        const response = await fetch('/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to get response');
        }
        
        const reader = response.body?.getReader();
        if (!reader) throw new Error('Response body is not readable');
        
        let accumulatedResponse = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // Convert the chunk to text
          const chunk = new TextDecoder().decode(value);
          
          // Parse the chunk as SSE data
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                
                // Handle different response formats
                if (data.choices && data.choices[0]?.delta?.content) {
                  // OpenAI format
                  accumulatedResponse += data.choices[0].delta.content;
                  setResponse(accumulatedResponse);
                } else if (data.candidates && data.candidates[0]?.content?.parts) {
                  // Gemini format
                  const content = data.candidates[0].content.parts[0]?.text || '';
                  accumulatedResponse += content;
                  setResponse(accumulatedResponse);
                }
                
                // Scroll to bottom of response
                if (responseRef.current) {
                  responseRef.current.scrollTop = responseRef.current.scrollHeight;
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      } else {
        // Handle non-streaming response
        const response = await fetch('/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to get response');
        }
        
        const data = await response.json();
        
        // Handle different response formats
        if (data.choices && data.choices[0]?.message?.content) {
          // OpenAI format
          setResponse(data.choices[0].message.content);
        } else if (data.candidates && data.candidates[0]?.content?.parts) {
          // Gemini format
          const content = data.candidates[0].content.parts[0]?.text || '';
          setResponse(content);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('Error submitting request:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveState = () => {
    if (!stateName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name for this state',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }
    
    const newSavedStates = [
      ...savedStates,
      { name: stateName, state: { ...state } }
    ];
    
    setSavedStates(newSavedStates);
    localStorage.setItem('playground-saved-states', JSON.stringify(newSavedStates));
    
    toast({
      title: 'Success',
      description: 'Playground state saved',
      status: 'success',
      duration: 3000,
      isClosable: true
    });
    
    setStateName('');
  };

  const handleLoadState = (index: number) => {
    setState({ ...savedStates[index].state });
    
    toast({
      title: 'State Loaded',
      description: `Loaded "${savedStates[index].name}"`,
      status: 'info',
      duration: 3000,
      isClosable: true
    });
  };

  const handleDeleteState = (index: number) => {
    const newSavedStates = [...savedStates];
    newSavedStates.splice(index, 1);
    
    setSavedStates(newSavedStates);
    localStorage.setItem('playground-saved-states', JSON.stringify(newSavedStates));
    
    toast({
      title: 'State Deleted',
      status: 'info',
      duration: 3000,
      isClosable: true
    });
  };

  const handleCopyResponse = () => {
    navigator.clipboard.writeText(response);
    
    toast({
      title: 'Copied',
      description: 'Response copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true
    });
  };

  const handleReset = () => {
    setState(DEFAULT_STATE);
    setResponse('');
    setError(null);
  };

  return (
    <Grid templateColumns="250px 1fr" h="100vh">
      <GridItem>
        <Sidebar />
      </GridItem>
      <GridItem p={6} overflowY="auto">
        <Box mb={6}>
          <Heading size="lg">API Playground</Heading>
          <Text color="gray.500">Test the Gemini API with different parameters</Text>
        </Box>

        <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
          <GridItem>
            <Box 
              bg={bgColor} 
              p={4} 
              borderRadius="md" 
              borderWidth="1px" 
              borderColor={borderColor}
              mb={4}
            >
              <Heading size="md" mb={4}>Request</Heading>
              
              <FormControl mb={4}>
                <Flex align="center" justify="space-between">
                  <FormLabel mb={0}>Model</FormLabel>
                  <Tooltip label="Refresh Models">
                    <IconButton
                      aria-label="Refresh models"
                      icon={<FiRefreshCw />}
                      size="sm"
                      onClick={fetchModels}
                      isLoading={isLoadingModels}
                      mr={2}
                    />
                  </Tooltip>
                </Flex>
                {modelError && (
                  <Alert status="error" mb={2} mt={2} size="sm" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription fontSize="sm">{modelError}</AlertDescription>
                  </Alert>
                )}
                <Select 
                  value={state.model}
                  onChange={(e) => setState({ ...state, model: e.target.value })}
                  mt={2}
                >
                  {availableModels.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl mb={4}>
                <FormLabel>System Message</FormLabel>
                <Textarea
                  value={state.messages[0].content}
                  onChange={(e) => {
                    const newMessages = [...state.messages];
                    newMessages[0] = { ...newMessages[0], content: e.target.value };
                    setState({ ...state, messages: newMessages });
                  }}
                  rows={3}
                />
              </FormControl>
              
              <FormControl mb={4}>
                <FormLabel>User Message</FormLabel>
                <Textarea
                  value={state.messages[1].content}
                  onChange={(e) => {
                    const newMessages = [...state.messages];
                    newMessages[1] = { ...newMessages[1], content: e.target.value };
                    setState({ ...state, messages: newMessages });
                  }}
                  rows={6}
                />
              </FormControl>
              
              <Grid templateColumns="1fr 1fr" gap={4} mb={4}>
                <FormControl>
                  <FormLabel>Temperature</FormLabel>
                  <Flex align="center">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={state.temperature}
                      onChange={(e) => setState({ ...state, temperature: parseFloat(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                    <Text ml={2} fontFamily="mono">{state.temperature}</Text>
                  </Flex>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Max Tokens</FormLabel>
                  <NumberInput
                    value={state.maxTokens}
                    onChange={(_, value) => setState({ ...state, maxTokens: value })}
                    min={1}
                    max={32768}
                    defaultValue={8192}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Default: 8192, Max: 32768
                  </Text>
                </FormControl>
              </Grid>
              
              <FormControl display="flex" alignItems="center" mb={4}>
                <FormLabel mb="0">Stream Response</FormLabel>
                <Switch 
                  isChecked={state.stream}
                  onChange={(e) => setState({ ...state, stream: e.target.checked })}
                />
              </FormControl>
              
              <Flex justify="space-between">
                <Button 
                  leftIcon={<FiSend />} 
                  colorScheme="blue" 
                  onClick={handleSubmit}
                  isLoading={isLoading}
                  loadingText="Generating..."
                >
                  Send Request
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={handleReset}
                >
                  Reset
                </Button>
              </Flex>
            </Box>
            
            <Box 
              bg={bgColor} 
              p={4} 
              borderRadius="md" 
              borderWidth="1px" 
              borderColor={borderColor}
            >
              <Heading size="md" mb={4}>Saved Prompts</Heading>
              
              <Flex mb={4}>
                <Input 
                  placeholder="Name this prompt"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  mr={2}
                />
                <Button 
                  leftIcon={<FiSave />} 
                  onClick={handleSaveState}
                >
                  Save
                </Button>
              </Flex>
              
              {savedStates.length === 0 ? (
                <Text color="gray.500">No saved prompts yet</Text>
              ) : (
                <Box maxH="200px" overflowY="auto">
                  {savedStates.map((saved, index) => (
                    <Flex 
                      key={index}
                      justify="space-between"
                      align="center"
                      p={2}
                      borderWidth="1px"
                      borderRadius="md"
                      mb={2}
                    >
                      <Text fontWeight="medium">{saved.name}</Text>
                      <Flex>
                        <Button 
                          size="sm" 
                          mr={2}
                          onClick={() => handleLoadState(index)}
                        >
                          Load
                        </Button>
                        <IconButton
                          aria-label="Delete saved state"
                          icon={<FiTrash2 />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleDeleteState(index)}
                        />
                      </Flex>
                    </Flex>
                  ))}
                </Box>
              )}
            </Box>
          </GridItem>
          
          <GridItem>
            <Box 
              bg={bgColor} 
              p={4} 
              borderRadius="md" 
              borderWidth="1px" 
              borderColor={borderColor}
              h="100%"
              display="flex"
              flexDirection="column"
            >
              <Flex justify="space-between" align="center" mb={4}>
                <Heading size="md">Response</Heading>
                {response && (
                  <Tooltip label="Copy to clipboard">
                    <IconButton
                      aria-label="Copy response"
                      icon={<FiCopy />}
                      size="sm"
                      onClick={handleCopyResponse}
                    />
                  </Tooltip>
                )}
              </Flex>
              
              {error && (
                <Alert status="error" mb={4} borderRadius="md">
                  <AlertIcon />
                  <AlertTitle>Error!</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {isLoading ? (
                <Flex justify="center" align="center" flex="1">
                  <Spinner size="xl" color="blue.500" />
                </Flex>
              ) : response ? (
                <Box 
                  ref={responseRef}
                  flex="1" 
                  overflowY="auto" 
                  p={4} 
                  borderWidth="1px" 
                  borderRadius="md"
                  whiteSpace="pre-wrap"
                  fontFamily="system-ui"
                >
                  {response}
                </Box>
              ) : (
                <Flex justify="center" align="center" flex="1" color="gray.500">
                  <Text>Response will appear here</Text>
                </Flex>
              )}
            </Box>
          </GridItem>
        </Grid>
      </GridItem>
    </Grid>
  );
}