"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@chakra-ui/react";

import {
  Box,
  Button,
  Input,
  Heading,
  VStack,
  Text,
  Icon,
  FormControl,
  FormLabel,
  Flex,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";

import { FaUniversity } from "react-icons/fa";

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useParams();
  const toast = useToast();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isValidToken, setIsValidToken] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      setMessage("Invalid reset link");
    }
  }, [token]);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Please fill all fields",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password must be at least 6 characters",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Password reset successfully. You can now login with your new password.");
        toast({
          title: "Password reset successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "top",
        });
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setIsValidToken(false);
        setMessage(data.message || "Failed to reset password");
        toast({
          title: data.message || "Failed to reset password",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "top",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Network error",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    }
    setLoading(false);
  };

  if (!isValidToken) {
    return (
      <Flex
        bg="#F8FAF9"
        minH="100vh"
        align="center"
        justify="center"
        p={4}
      >
        <Box
          bg="white"
          p={10}
          rounded="2xl"
          shadow="lg"
          border="1px solid #E3EDE8"
          width="100%"
          maxW="450px"
        >
          <VStack spacing={6}>
            <Icon as={FaUniversity} w={16} h={16} color="#2A7F62" />
            <Heading size="lg" color="#1E4D2B">
              ગ્રામ પંચાયત
            </Heading>
            <Alert status="error">
              <AlertIcon />
              <Text>આ રીસેટ લિંક અમાન્ય અથવા સમાપ્ત થઈ ગઈ છે.</Text>
            </Alert>
            <Button
              colorScheme="blue"
              onClick={() => navigate("/forgot-password")}
            >
              નવો રીસેટ ઇમેઇલ મેળવો
            </Button>
            <Text
              color="blue.500"
              cursor="pointer"
              onClick={() => navigate("/login")}
            >
              લોગિન પર પાછા જાઓ
            </Text>
          </VStack>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex
      bg="#F8FAF9"
      minH="100vh"
      align="center"
      justify="center"
      p={4}
    >
      <Box
        bg="white"
        p={10}
        rounded="2xl"
        shadow="lg"
        border="1px solid #E3EDE8"
        width="100%"
        maxW="450px"
      >
        <VStack spacing={6}>
          {/* Panchayat Logo */}
          <Icon as={FaUniversity} w={16} h={16} color="#2A7F62" />

          {/* Panchayat Title */}
          <Heading
            size="lg"
            textAlign="center"
            mb={1}
            color="#1E4D2B"
            fontWeight="700"
          >
            ગ્રામ પંચાયત
          </Heading>

          {/* Reset Password Title */}
          <Text
            textAlign="center"
            color="green.700"
            fontSize="lg"
            fontWeight="500"
            mb={4}
          >
            પાસવર્ડ રીસેટ કરો
          </Text>

          {/* NEW PASSWORD */}
          <FormControl>
            <FormLabel fontWeight="600">નવો પાસવર્ડ</FormLabel>
            <Input
              type="password"
              size="lg"
              bg="gray.100"
              rounded="xl"
              placeholder="નવો પાસવર્ડ દાખલ કરો"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </FormControl>

          {/* CONFIRM PASSWORD */}
          <FormControl>
            <FormLabel fontWeight="600">પાસવર્ડ પુષ્ટિ કરો</FormLabel>
            <Input
              type="password"
              size="lg"
              bg="gray.100"
              rounded="xl"
              placeholder="પાસવર્ડ ફરી દાખલ કરો"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </FormControl>

          {/* SUCCESS MESSAGE */}
          {message && (
            <Alert status="success">
              <AlertIcon />
              {message}
            </Alert>
          )}

          {/* RESET PASSWORD BUTTON */}
          <Button
            width="100%"
            colorScheme="green"
            size="lg"
            rounded="xl"
            fontWeight="bold"
            onClick={handleResetPassword}
            isLoading={loading}
            mt={4}
          >
            પાસવર્ડ રીસેટ કરો
          </Button>

          {/* BACK TO LOGIN */}
          <Text
            color="blue.500"
            fontSize="sm"
            textAlign="center"
            cursor="pointer"
            onClick={() => navigate("/login")}
            mt={2}
          >
            લોગિન પર પાછા જાઓ
          </Text>
        </VStack>
      </Box>
    </Flex>
  );
}