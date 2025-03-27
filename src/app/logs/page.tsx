'use client'; // Add this because Chakra UI components might need it

import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, GridItem, Box, Heading, Text, Tabs, TabList, TabPanels, Tab, TabPanel,
  Spinner, Alert, AlertIcon, Code, VStack, HStack, Input, Button, Select, useToast,
  useColorModeValue // Import useColorModeValue
} from '@chakra-ui/react';
import Sidebar from '@/components/layout/Sidebar';

type LogType = 'requests' | 'errors' | 'keys';

const LogsPage = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [logType, setLogType] = useState<LogType>('requests');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState<number>(100);
  const [search, setSearch] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>(''); // Debounced search term
  const toast = useToast();
  // Define colors for light/dark mode
  const logBoxBg = useColorModeValue('gray.50', 'gray.700');
  const codeBg = useColorModeValue('white', 'gray.800');
  const codeColor = useColorModeValue('gray.800', 'gray.100');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        type: logType,
        limit: limit.toString(),
      });
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      // Add startDate and endDate params here if date pickers were implemented

      const response = await fetch(`/api/logs?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (err: any) {
      console.error("Failed to fetch logs:", err);
      setError(err.message || 'Failed to fetch logs.');
      setLogs([]);
      toast({
        title: "Error fetching logs",
        description: err.message || 'An unexpected error occurred.',
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [logType, limit, searchTerm, toast]); // Add dependencies

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]); // Fetch logs when component mounts or filters change

  // Basic debounce for search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(search);
    }, 500); // Adjust delay as needed

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  const handleTabChange = (index: number) => {
    const types: LogType[] = ['requests', 'errors', 'keys'];
    setLogType(types[index]);
  };

  const handleSearch = () => {
      setSearchTerm(search); // Trigger search immediately on button click
      // fetchLogs(); // fetchLogs is already triggered by searchTerm change via useEffect
  };

  return (
    <Grid templateColumns="250px 1fr" h="100vh">
      <GridItem>
        <Sidebar />
      </GridItem>
      <GridItem p={6} overflowY="auto">
        <VStack align="stretch" spacing={4}>
          <Heading size="lg">Application Logs</Heading>

          <HStack spacing={4}>
             <Input
               placeholder="Search logs..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
             />
             <Select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                width="150px"
             >
                 <option value={50}>50</option>
                 <option value={100}>100</option>
                 <option value={200}>200</option>
                 <option value={500}>500</option>
             </Select>
             <Button onClick={handleSearch} isLoading={loading}>Search</Button>
             {/* Add Date Pickers here if needed */}
          </HStack>

          <Tabs onChange={handleTabChange} variant="soft-rounded" colorScheme="blue">
            <TabList>
              <Tab>Requests</Tab>
              <Tab>Errors</Tab>
              <Tab>Keys</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                {loading && <Spinner />}
                {error && (
                  <Alert status="error">
                    <AlertIcon />
                    {error}
                  </Alert>
                )}
                {!loading && !error && (
                  <Box bg={logBoxBg} p={4} borderRadius="md" maxHeight="70vh" overflowY="auto">
                    {logs.length > 0 ? (
                      logs.map((log, index) => (
                        <Code display="block" whiteSpace="pre-wrap" key={index} p={2} mb={2} borderRadius="sm" bg={codeBg} color={codeColor}>
                          {JSON.stringify(log, null, 2)}
                        </Code>
                      ))
                    ) : (
                      <Text>No request logs found matching criteria.</Text>
                    )}
                  </Box>
                )}
              </TabPanel>
              <TabPanel>
                 {loading && <Spinner />}
                 {error && (
                   <Alert status="error">
                     <AlertIcon />
                     {error}
                   </Alert>
                 )}
                 {!loading && !error && (
                   <Box bg={logBoxBg} p={4} borderRadius="md" maxHeight="70vh" overflowY="auto">
                     {logs.length > 0 ? (
                       logs.map((log, index) => (
                         <Code display="block" whiteSpace="pre-wrap" key={index} p={2} mb={2} borderRadius="sm" bg={codeBg} color={codeColor}>
                           {JSON.stringify(log, null, 2)}
                         </Code>
                       ))
                     ) : (
                       <Text>No error logs found matching criteria.</Text>
                     )}
                   </Box>
                 )}
              </TabPanel>
              <TabPanel>
                 {loading && <Spinner />}
                 {error && (
                   <Alert status="error">
                     <AlertIcon />
                     {error}
                   </Alert>
                 )}
                 {!loading && !error && (
                   <Box bg={logBoxBg} p={4} borderRadius="md" maxHeight="70vh" overflowY="auto">
                     {logs.length > 0 ? (
                       logs.map((log, index) => (
                         <Code display="block" whiteSpace="pre-wrap" key={index} p={2} mb={2} borderRadius="sm" bg={codeBg} color={codeColor}>
                           {JSON.stringify(log, null, 2)}
                         </Code>
                       ))
                     ) : (
                       <Text>No key logs found matching criteria.</Text>
                     )}
                   </Box>
                 )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </GridItem>
    </Grid>
  );
};

export default LogsPage;