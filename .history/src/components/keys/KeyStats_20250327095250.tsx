'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Skeleton,
  Text,
  useColorModeValue,
  Flex,
  Button,
  IconButton,
  Tooltip,
  HStack,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure
} from '@chakra-ui/react';
import { FiRefreshCw, FiTrash2, FiEdit } from 'react-icons/fi';
import { useRef } from 'react';

interface ApiKey {
  _id: string;
  key: string;
  isActive: boolean;
  lastUsed: string | null;
  rateLimitResetAt: string | null;
  failureCount: number;
  requestCount: number;
}

export default function KeyStats() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();

  const tableBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const fetchKeys = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/keys');
      if (!response.ok) {
        throw new Error(`Error fetching keys: ${response.statusText}`);
      }
      const data = await response.json();
      setKeys(data);
    } catch (error) {
      console.error('Error fetching keys:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch API keys',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  // Function to get status badge
  const getStatusBadge = (key: ApiKey) => {
    if (!key.isActive) {
      return <Badge colorScheme="red">Inactive</Badge>;
    }
    
    if (key.rateLimitResetAt && new Date(key.rateLimitResetAt) > new Date()) {
      return <Badge colorScheme="yellow">Rate Limited</Badge>;
    }
    
    return <Badge colorScheme="green">Active</Badge>;
  };

  // Function to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Function to delete a key
  const handleDeleteKey = async () => {
    if (!selectedKeyId) return;
    
    try {
      const response = await fetch(`/api/admin/keys/${selectedKeyId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete key');
      }
      
      toast({
        title: 'Success',
        description: 'API key deactivated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Refresh the keys list
      fetchKeys();
    } catch (error) {
      console.error('Error deleting key:', error);
      toast({
        title: 'Error',
        description: 'Failed to deactivate API key',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onClose();
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontSize="sm" color="gray.500">
          Showing {keys.length} API keys
        </Text>
        <Button
          size="sm"
          leftIcon={<FiRefreshCw />}
          onClick={fetchKeys}
          isLoading={isLoading}
        >
          Refresh
        </Button>
      </Flex>

      <Box overflowX="auto">
        <Table variant="simple" size="sm" bg={tableBg} borderWidth="1px" borderColor={borderColor} borderRadius="md">
          <Thead>
            <Tr>
              <Th>API Key</Th>
              <Th>Status</Th>
              <Th>Last Used</Th>
              <Th>Requests</Th>
              <Th>Failures</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <Tr key={index}>
                  <Td><Skeleton height="20px" /></Td>
                  <Td><Skeleton height="20px" width="80px" /></Td>
                  <Td><Skeleton height="20px" width="150px" /></Td>
                  <Td><Skeleton height="20px" width="60px" /></Td>
                  <Td><Skeleton height="20px" width="60px" /></Td>
                  <Td><Skeleton height="20px" width="100px" /></Td>
                </Tr>
              ))
            ) : keys.length === 0 ? (
              <Tr>
                <Td colSpan={6} textAlign="center" py={4}>
                  No API keys found. Add a key to get started.
                </Td>
              </Tr>
            ) : (
              keys.map((key) => (
                <Tr key={key._id}>
                  <Td fontFamily="mono">{key.key}</Td>
                  <Td>{getStatusBadge(key)}</Td>
                  <Td>{formatDate(key.lastUsed)}</Td>
                  <Td>{key.requestCount}</Td>
                  <Td>{key.failureCount}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <Tooltip label="Delete Key">
                        <IconButton
                          aria-label="Delete key"
                          icon={<FiTrash2 />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => {
                            setSelectedKeyId(key._id);
                            onOpen();
                          }}
                        />
                      </Tooltip>
                    </HStack>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Deactivate API Key
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to deactivate this API key? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteKey} ml={3}>
                Deactivate
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
