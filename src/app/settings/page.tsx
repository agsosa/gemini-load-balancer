'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,
  Button,
  useToast,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Flex,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  IconButton,
  Tooltip,
  Spinner,
} from '@chakra-ui/react';
import { FiSave, FiRefreshCw } from 'react-icons/fi';
import Sidebar from '@/components/layout/Sidebar';
import { useContext } from 'react';
import { ThemeContext } from '@/contexts/ThemeContext';

interface Settings {
  keyRotationRequestCount: number;
  maxFailureCount: number;
  rateLimitCooldown: number;
  logRetentionDays: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    keyRotationRequestCount: 5,
    maxFailureCount: 5,
    rateLimitCooldown: 60,
    logRetentionDays: 14,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  
  const toast = useToast();
  const { colorMode, toggleColorMode } = useContext(ThemeContext);
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error(`Error fetching settings: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSettings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch settings');
      console.error('Error fetching settings:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch settings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setError(null);
    setIsSaved(false);
    
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }
      
      const data = await response.json();
      setSettings(data.settings);
      setIsSaved(true);
      
      toast({
        title: 'Settings saved',
        description: 'Your settings have been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
      toast({
        title: 'Error',
        description: err.message || 'Failed to save settings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Grid templateColumns="250px 1fr" h="100vh">
        <GridItem>
          <Sidebar />
        </GridItem>
        <GridItem p={6}>
          <Flex justify="center" align="center" h="80vh">
            <Spinner size="xl" color="blue.500" />
          </Flex>
        </GridItem>
      </Grid>
    );
  }

  return (
    <Grid templateColumns="250px 1fr" h="100vh">
      <GridItem>
        <Sidebar />
      </GridItem>
      <GridItem p={6} overflowY="auto">
        <Flex justify="space-between" align="center" mb={6}>
          <Box>
            <Heading size="lg">Settings</Heading>
            <Text color="gray.500">Configure your Gemini Load Balancer</Text>
          </Box>
          <Tooltip label="Refresh Settings">
            <IconButton
              aria-label="Refresh settings"
              icon={<FiRefreshCw />}
              onClick={fetchSettings}
              isLoading={isLoading}
            />
          </Tooltip>
        </Flex>

        {error && (
          <Alert status="error" mb={6} borderRadius="md">
            <AlertIcon />
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isSaved && (
          <Alert status="success" mb={6} borderRadius="md">
            <AlertIcon />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>Settings saved successfully</AlertDescription>
          </Alert>
        )}

        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" shadow="sm">
            <CardHeader>
              <Heading size="md">API Key Settings</Heading>
            </CardHeader>
            <Divider borderColor={borderColor} />
            <CardBody>
              <FormControl mb={4}>
                <FormLabel>Key Rotation Request Count</FormLabel>
                <NumberInput
                  value={settings.keyRotationRequestCount}
                  onChange={(_, value) => setSettings({ ...settings, keyRotationRequestCount: value })}
                  min={1}
                  max={100}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Number of requests before rotating to the next API key
                </Text>
              </FormControl>

              <FormControl mb={4}>
                <FormLabel>Maximum Failure Count</FormLabel>
                <NumberInput
                  value={settings.maxFailureCount}
                  onChange={(_, value) => setSettings({ ...settings, maxFailureCount: value })}
                  min={1}
                  max={20}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Number of failures before deactivating an API key
                </Text>
              </FormControl>

              <FormControl mb={4}>
                <FormLabel>Rate Limit Cooldown (seconds)</FormLabel>
                <NumberInput
                  value={settings.rateLimitCooldown}
                  onChange={(_, value) => setSettings({ ...settings, rateLimitCooldown: value })}
                  min={10}
                  max={3600}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Default cooldown period when rate limit is hit (if not specified by API)
                </Text>
              </FormControl>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" shadow="sm">
            <CardHeader>
              <Heading size="md">System Settings</Heading>
            </CardHeader>
            <Divider borderColor={borderColor} />
            <CardBody>
              <FormControl mb={4}>
                <FormLabel>Log Retention (days)</FormLabel>
                <NumberInput
                  value={settings.logRetentionDays}
                  onChange={(_, value) => setSettings({ ...settings, logRetentionDays: value })}
                  min={1}
                  max={90}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Number of days to keep logs before automatic deletion
                </Text>
              </FormControl>

              <FormControl display="flex" alignItems="center" mb={4}>
                <FormLabel mb="0">Dark Mode</FormLabel>
                <Switch 
                  isChecked={colorMode === 'dark'}
                  onChange={toggleColorMode}
                />
              </FormControl>
            </CardBody>
          </Card>
        </Grid>

        <Flex justify="flex-end" mt={6}>
          <Button
            leftIcon={<FiSave />}
            colorScheme="blue"
            onClick={handleSaveSettings}
            isLoading={isSaving}
            loadingText="Saving..."
          >
            Save Settings
          </Button>
        </Flex>
      </GridItem>
    </Grid>
  );
}