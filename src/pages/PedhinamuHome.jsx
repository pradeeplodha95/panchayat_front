"use client";

import { Box, Heading, SimpleGrid, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { FiPlusCircle, FiList } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import {
  FiUserCheck,
  FiFileText,
  FiLogOut,
  FiSettings,
  FiTrendingUp,
} from "react-icons/fi";

export default function PedhinamuHome() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Box bg="#F8FAF9" minH="100vh" p={10}>
      <Heading size="lg" mb={8} color="green.700">
        {t("pedhinamu")}
      </Heading>

      <SimpleGrid columns={[1, 2]} spacing={8} maxW="800px">

        {/* CREATE NEW */}
        <Box
          p={8}
          bg="white"
          rounded="2xl"
          shadow="lg"
          cursor="pointer"
          border="1px solid #E3EDE8"
          textAlign="center"
          _hover={{ transform: "scale(1.05)", transition: ".2s" }}
          onClick={() => navigate("/pedhinamu/create")}
        >
          <FiPlusCircle size={40} color="#2A7F62" />
          <Heading size="md" mt={4}>{t("createPedhinamu")}</Heading>
          <Text mt={2}>{t("createPedhinamuDesc")}</Text>
        </Box>

        {/* VIEW LIST */}
        <Box
          p={8}
          bg="white"
          rounded="2xl"
          shadow="lg"
          cursor="pointer"
          border="1px solid #E3EDE8"
          textAlign="center"
          _hover={{ transform: "scale(1.05)", transition: ".2s" }}
          onClick={() => navigate("/pedhinamu/list")}
        >
          <FiList size={40} color="#2A7F62" />
          <Heading size="md" mt={4}>{t("viewPedhinamu")}</Heading>
          <Text mt={2}>{t("viewPedhinamuDesc")}</Text>
        </Box>

          {/* CARD: Records */}
                <Box
                  bg="white"
                  p={8}
                  rounded="2xl"
                  shadow="lg"
                  border="1px solid #E3EDE8"
                  textAlign="center"
                  cursor="pointer"
                  _hover={{ transform: "scale(1.05)", transition: "0.2s" }}
                  onClick={() => navigate("/records")}
                >
                  <FiFileText size={40} color="#2A7F62" />
                  <Heading size="md" mt={4} color="#1E4D2B">
                    {t("certificates")}
                  </Heading>
                  <Text mt={2} color="gray.600">
                    {t("cardRecordsText")}
                  </Text>
                </Box>

      </SimpleGrid>
    </Box>
  );
}
