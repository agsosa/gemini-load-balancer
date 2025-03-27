'use client'; // Add this because Chakra UI components might need it

import React from 'react';
import { Grid, GridItem, Box, Heading, Text } from '@chakra-ui/react'; // Import Grid components
import Sidebar from '@/components/layout/Sidebar'; // Import the Sidebar

const LogsPage = () => {
  return (
    <Grid templateColumns="250px 1fr" h="100vh"> {/* Define the grid layout */}
      <GridItem>
        <Sidebar /> {/* Render the Sidebar */}
      </GridItem>
      <GridItem p={6} overflowY="auto"> {/* Main content area */}
        <Box>
          <Heading size="lg" mb={4}>Application Logs</Heading>
          {/* Log content will go here */}
          <Text>This is where the logs will be displayed.</Text>
        </Box>
      </GridItem>
    </Grid>
  );
};

export default LogsPage;