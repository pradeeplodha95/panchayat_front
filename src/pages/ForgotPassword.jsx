"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
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

export default function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Please enter your email",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Password reset email sent successfully. Please check your email.");
        toast({
          title: "Email sent successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "top",
        });
      } else {
        toast({
          title: data.message || "Failed to send reset email",
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

          {/* Forgot Password Title */}
          <Text
            textAlign="center"
            color="green.700"
            fontSize="lg"
            fontWeight="500"
            mb={4}
          >
            પાસવર્ડ ભૂલી ગયા છો
          </Text>

          {/* EMAIL */}
          <FormControl>
            <FormLabel fontWeight="600">ઇમેઇલ</FormLabel>
            <Input
              type="email"
              size="lg"
              bg="gray.100"
              rounded="xl"
              placeholder="તમારું ઇમેઇલ દાખલ કરો"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormControl>

          {/* SUCCESS MESSAGE */}
          {message && (
            <Alert status="success">
              <AlertIcon />
              {message}
            </Alert>
          )}

          {/* SEND RESET EMAIL BUTTON */}
          <Button
            width="100%"
            colorScheme="green"
            size="lg"
            rounded="xl"
            fontWeight="bold"
            onClick={handleForgotPassword}
            isLoading={loading}
            mt={4}
          >
            રીસેટ ઇમેઇલ મોકલો
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