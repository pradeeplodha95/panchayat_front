"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  VStack,
  Text,
  Spinner,
  Flex,
  Button,
  Divider
} from "@chakra-ui/react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

const CashMelView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_ROOT = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
    : "http://localhost:5000/api";
  const API_BASE = `${API_ROOT}/cashmel`;

  useEffect(() => {
    fetch(`${API_BASE}/${id}`)
      .then((res) => res.json())
      .then((data) => setEntry(data.data))
      .finally(() => setLoading(false));
  }, [id]);

  const toGujaratiDigits = (num) => {
    if (!num && num !== 0) return "";
    const guj = ["૦","૧","૨","૩","૪","૫","૬","૭","૮","૯"];
    return String(num).split("").map((d) => guj[d] || d).join("");
  };

  const formatDateToGujarati = (d) => {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    return `${toGujaratiDigits(day)}/${toGujaratiDigits(m)}/${toGujaratiDigits(y)}`;
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" p={10}>
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (!entry) return <Text>Data not found</Text>;

  return (
    <Box bg="#F8FAF9" minH="100vh" p={10}>
      <Flex justify="space-between" align="center" mb={8}>
        <Heading size="lg" color="#1E4D2B">
           રોકડ નોંધ વિગતો 
        </Heading>

        <Button
          leftIcon={<FiArrowLeft />}
          colorScheme="green"
          variant="outline"
          onClick={() => navigate("/cashmel/details")}
        >
          પાછા જાઓ
        </Button>
      </Flex>

      <Box
        bg="white"
        p={8}
        rounded="2xl"
        shadow="lg"
        border="1px solid #E3EDE8"
        maxW="700px"
        mx="auto"
      >
        <VStack align="stretch" spacing={4}>
          <Field label="તારીખ" value={formatDateToGujarati(entry.date)} />
          <Field label="નામ" value={entry.name} />
          <Field label="રશીદ / પેમેન્ટ નંબર" value={toGujaratiDigits(entry.receiptPaymentNo)} />
          <Field
            label="વ્યવહાર પ્રકાર"
            value={entry.vyavharType === "aavak" ? "આવક" : "જાવક"}
          />
          <Field label="વિવર" value={entry.category} />
          <Field label="રકમ" value={`₹ ${toGujaratiDigits(entry.amount)}`} />
        </VStack>
      </Box>
    </Box>
  );
};

// Small component for display rows
const Field = ({ label, value }) => (
  <Box>
    <Text fontWeight="bold" color="green.700">
      {label}
    </Text>
    <Text fontSize="lg" mt={1}>
      {value}
    </Text>
    <Divider my={3} />
  </Box>
);

export default CashMelView;
