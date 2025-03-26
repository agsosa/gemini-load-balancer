'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Box, 
  VStack, 
  Heading, 
  Text, 
  Flex, 
  Icon, 
  useColorModeValue,
  Button,
  Divider,
  Tooltip
} from '@chakra-ui/react';
import { 
  FiHome, 
  FiKey, 
  FiSettings, 
  FiFileText, 
  FiBarChart2, 
  FiCode,
  FiMoon,
  FiSun
} from 'react-icons/fi';
import { useContext } from 'react';
import { ThemeContext } from '@/contexts/ThemeContext';

interface NavItemProps {
  icon: any;
  href: string;
  children: React.ReactNode;
  isActive?: boolean;
}

const NavItem = ({ icon, href, children, isActive }: NavItemProps) => {
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const activeColor = useColorModeValue('blue.600', 'blue.200');

  return (
    <Link href={href} passHref style={{ textDecoration: 'none', width: '100%' }}>
      <Flex
        align="center"
        p="3"
        mx="2"
        borderRadius="md"
        role="group"
        cursor="pointer"
        bg={isActive ? activeBg : 'transparent'}
        color={isActive ? activeColor : undefined}
        _hover={{
          bg: isActive ? activeBg : hoverBg,
        }}
      >
        <Icon
          mr="3"
          fontSize="16"
          as={icon}
        />
        <Text fontSize="sm" fontWeight={isActive ? "bold" : "medium"}>
          {children}
        </Text>
      </Flex>
    </Link>
  );
};

export default function Sidebar() {
  const pathname = usePathname();
  const { colorMode, toggleColorMode } = useContext(ThemeContext);
  
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      h="100%"
      w="100%"
      bg={bg}
      borderRight="1px"
      borderColor={borderColor}
      py={4}
    >
      <Flex direction="column" h="full" justify="space-between">
        <Box>
          <Flex px={4} mb={6} align="center">
            <Heading size="md" fontWeight="bold">Gemini LB</Heading>
          </Flex>

          <VStack align="stretch" spacing={1}>
            <NavItem 
              icon={FiHome} 
              href="/dashboard" 
              isActive={pathname === '/dashboard'}
            >
              Dashboard
            </NavItem>
            
            <NavItem 
              icon={FiKey} 
              href="/keys" 
              isActive={pathname === '/keys'}
            >
              API Keys
            </NavItem>
            
            <NavItem 
              icon={FiFileText} 
              href="/logs" 
              isActive={pathname === '/logs'}
            >
              Logs
            </NavItem>
            
            <NavItem 
              icon={FiBarChart2} 
              href="/stats" 
              isActive={pathname === '/stats'}
            >
              Statistics
            </NavItem>
            
            <NavItem 
              icon={FiCode} 
              href="/playground" 
              isActive={pathname === '/playground'}
            >
              Playground
            </NavItem>
            
            <NavItem 
              icon={FiSettings} 
              href="/settings" 
              isActive={pathname === '/settings'}
            >
              Settings
            </NavItem>
          </VStack>
        </Box>

        <Box px={4}>
          <Divider my={4} />
          <Tooltip label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}>
            <Button 
              leftIcon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
              onClick={toggleColorMode}
              variant="ghost"
              size="sm"
              width="full"
              justifyContent="flex-start"
            >
              {colorMode === 'light' ? 'Dark Mode' : 'Light Mode'}
            </Button>
          </Tooltip>
        </Box>
      </Flex>
    </Box>
  );
}