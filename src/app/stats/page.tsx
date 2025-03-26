'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  Flex,
  Select,
  FormControl,
  FormLabel,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  useToast,
  Button,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { FiRefreshCw } from 'react-icons/fi';
import Sidebar from '@/components/layout/Sidebar';

export default function StatsPage() {
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const lineColor = useColorModeValue('#3182CE', '#63B3ED');
  const errorColor = useColorModeValue('#E53E3E', '#FC8181');
  const toast = useToast();
  
  // Colors for pie charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/stats?timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error(`Error fetching statistics: ${response.statusText}`);
      }
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch statistics');
      console.error('Error fetching stats:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch statistics',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  // Handle case when stats is null
  if (!isLoading && !error && !stats) {
    return (
      <Grid templateColumns="250px 1fr" h="100vh">
        <GridItem>
          <Sidebar />
        </GridItem>
        <GridItem p={6}>
          <Alert status="info">
            <AlertIcon />
            <AlertTitle>No Data</AlertTitle>
            <AlertDescription>
              No statistics data is available yet. Make some API requests to generate statistics.
            </AlertDescription>
          </Alert>
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
            <Heading size="lg">Usage Statistics</Heading>
            <Text color="gray.500">Monitor your Gemini API usage</Text>
          </Box>
          
          <Flex gap={2} align="center">
            <FormControl w="200px">
              <Select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </Select>
            </FormControl>
            <Tooltip label="Refresh Statistics">
              <IconButton
                aria-label="Refresh statistics"
                icon={<FiRefreshCw />}
                onClick={fetchStats}
                isLoading={isLoading}
              />
            </Tooltip>
          </Flex>
        </Flex>

        {error && (
          <Alert status="error" mb={6} borderRadius="md">
            <AlertIcon />
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <Flex justify="center" align="center" h="400px">
            <Spinner size="xl" color="blue.500" />
          </Flex>
        ) : stats ? (
          <>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={6}>
              <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" shadow="sm">
                <CardBody>
                  <Stat>
                    <StatLabel>Total Requests</StatLabel>
                    <StatNumber>{stats.totalRequests.toLocaleString()}</StatNumber>
                    <StatHelpText>In selected period</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
              
              <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" shadow="sm">
                <CardBody>
                  <Stat>
                    <StatLabel>Error Rate</StatLabel>
                    <StatNumber>{(100 - stats.successRate).toFixed(1)}%</StatNumber>
                    <StatHelpText>{stats.totalErrors} errors</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
              
              <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" shadow="sm">
                <CardBody>
                  <Stat>
                    <StatLabel>Avg Response Time</StatLabel>
                    <StatNumber>{stats.avgResponseTime}ms</StatNumber>
                    <StatHelpText>Across all requests</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
              
              <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" shadow="sm">
                <CardBody>
                  <Stat>
                    <StatLabel>Active Keys</StatLabel>
                    <StatNumber>{stats.keyUsageData?.length || 0}</StatNumber>
                    <StatHelpText>Currently in rotation</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>

            <Tabs variant="enclosed" mb={6}>
              <TabList>
                <Tab>Request Volume</Tab>
                <Tab>Key Usage</Tab>
                <Tab>Model Usage</Tab>
              </TabList>
              
              <TabPanels>
                <TabPanel p={0} pt={4}>
                  <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" shadow="sm">
                    <CardHeader>
                      <Heading size="md">Request Volume Over Time</Heading>
                    </CardHeader>
                    <Divider borderColor={borderColor} />
                    <CardBody>
                      {stats.requestData?.length > 0 ? (
                        <Box h="400px">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={stats.requestData}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <RechartsTooltip />
                              <Legend />
                              <Line 
                                type="monotone" 
                                dataKey="requests" 
                                stroke={lineColor} 
                                activeDot={{ r: 8 }} 
                                name="Requests"
                              />
                              <Line 
                                type="monotone" 
                                dataKey="errors" 
                                stroke={errorColor} 
                                name="Errors"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </Box>
                      ) : (
                        <Flex justify="center" align="center" h="200px">
                          <Text color="gray.500">No request data available for this time period</Text>
                        </Flex>
                      )}
                    </CardBody>
                  </Card>
                  
                  <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" shadow="sm" mt={6}>
                    <CardHeader>
                      <Heading size="md">Hourly Request Distribution</Heading>
                    </CardHeader>
                    <Divider borderColor={borderColor} />
                    <CardBody>
                      {stats.hourlyData?.length > 0 ? (
                        <Box h="300px">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={stats.hourlyData}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="hour" />
                              <YAxis />
                              <RechartsTooltip />
                              <Legend />
                              <Bar dataKey="requests" fill={lineColor} name="Requests" />
                            </BarChart>
                          </ResponsiveContainer>
                        </Box>
                      ) : (
                        <Flex justify="center" align="center" h="200px">
                          <Text color="gray.500">No hourly data available for this time period</Text>
                        </Flex>
                      )}
                    </CardBody>
                  </Card>
                </TabPanel>
                
                <TabPanel p={0} pt={4}>
                  <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" shadow="sm">
                    <CardHeader>
                      <Heading size="md">API Key Usage Distribution</Heading>
                    </CardHeader>
                    <Divider borderColor={borderColor} />
                    <CardBody>
                      {stats.keyUsageData?.length > 0 ? (
                        <Box h="400px">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={stats.keyUsageData}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={150}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {stats.keyUsageData.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip formatter={(value: any) => `${value}%`} />
                            </PieChart>
                          </ResponsiveContainer>
                        </Box>
                      ) : (
                        <Flex justify="center" align="center" h="200px">
                          <Text color="gray.500">No key usage data available</Text>
                        </Flex>
                      )}
                    </CardBody>
                  </Card>
                </TabPanel>
                
                <TabPanel p={0} pt={4}>
                  <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" shadow="sm">
                    <CardHeader>
                      <Heading size="md">Model Usage Distribution</Heading>
                    </CardHeader>
                    <Divider borderColor={borderColor} />
                    <CardBody>
                      {stats.modelUsageData?.length > 0 ? (
                        <Box h="400px">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={stats.modelUsageData}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={150}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {stats.modelUsageData.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip formatter={(value: any) => `${value}%`} />
                            </PieChart>
                          </ResponsiveContainer>
                        </Box>
                      ) : (
                        <Flex justify="center" align="center" h="200px">
                          <Text color="gray.500">No model usage data available</Text>
                        </Flex>
                      )}
                    </CardBody>
                  </Card>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </>
        ) : null}
      </GridItem>
    </Grid>
  );
}