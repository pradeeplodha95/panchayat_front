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
  Flex
} from "@chakra-ui/react";

import { FaUniversity } from "react-icons/fa";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

const handleLogin = async () => {
  setLoading(true);
  try {
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (data.trialExpired) {
      setErrorMsg(data.message);
      setLoading(false);
      return;
    }

    if (!data.token) {
      toast({
        title: data.message || t("error"),
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      setLoading(false);
      return;
    }

    toast({
      title: t("success"),
      status: "success",
      duration: 2000,
      isClosable: true,
      position: "top",
    });

    // delay redirect slightly so toast becomes visible
    setTimeout(() => {
      localStorage.setItem("token", data.token);

      // 👉 NEW: Save username
      localStorage.setItem("username", data.user?.username || "");

      // Redirect to admin if admin, otherwise dashboard
      if (data.user?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    }, 800);
  } catch (err) {
    console.error(err);
    toast({
      title: t("error"),
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

          {/* Digital Portal */}
          <Text
            textAlign="center"
            color="green.700"
            fontSize="lg"
            fontWeight="500"
            mb={4}
          >
            {t("digitalPortal")}
          </Text>

          {/* USERNAME */}
          <FormControl>
            <FormLabel fontWeight="600">{t("username")}</FormLabel>
            <Input
              size="lg"
              bg="gray.100"
              rounded="xl"
              placeholder={t("username")}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </FormControl>

          {/* PASSWORD */}
          <FormControl>
            <FormLabel fontWeight="600">{t("password")}</FormLabel>
            <Input
              type="password"
              size="lg"
              bg="gray.100"
              rounded="xl"
              placeholder={t("password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormControl>

          {/* ERROR MESSAGE */}
          {errorMsg && (
            <Text color="red.500" fontSize="sm">
              {errorMsg}
            </Text>
          )}

          {/* LOGIN BUTTON */}
          <Button
            width="100%"
            colorScheme="green"
            size="lg"
            rounded="xl"
            fontWeight="bold"
            onClick={handleLogin}
            isLoading={loading}
            mt={4}
          >
            {t("login")}
          </Button>

          {/* FORGOT PASSWORD LINK */}
          <Text
            color="blue.500"
            fontSize="sm"
            textAlign="center"
            cursor="pointer"
            onClick={() => navigate("/forgot-password")}
            mt={2}
          >
            પાસવર્ડ ભૂલી ગયા છો?
          </Text>

          {/* REGISTER LINK */}
         <VStack spacing={2} width="100%" pt={4} borderTop="1px solid #e5e5e5">
  <Text color="#64748b" fontSize="sm">
    નવો વપરાશકર્તા છો?
  </Text>
  <Button
    width="100%"
    variant="outline"
    colorScheme="blue"
    size="sm"
    onClick={() => navigate("/register")}
  >
    અહીં નોંધણી કરો
  </Button>
</VStack>


        </VStack>
      </Box>
    </Flex>
  );
}
