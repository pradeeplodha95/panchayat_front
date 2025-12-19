"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Heading,
  Button,
  Text,
  HStack,
  Flex,
  Badge,
  IconButton,
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalFooter, ModalCloseButton,
  useDisclosure
} from "@chakra-ui/react";
import { ViewIcon, EditIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DeleteIcon } from "@chakra-ui/icons";
import { useToast } from "@chakra-ui/react";
import Pagination from "../components/Pagination";
import LoaderSpinner from "../components/LoaderSpinner";



export default function Records() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refresh, setRefresh] = useState(0);


  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, refresh]);

  const fetchData = async (page) => {
    setLoading(true);
    const res = await fetch(`http://localhost:5000/api/pedhinamu?page=${page}&limit=10`);
    const json = await res.json();

    setList(json.data);
    setTotalPages(json.totalPages);
    setLoading(false);

    return json.data;  // 🔥 RETURN UPDATED LIST
  };




  const deleteRecord = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/pedhinamu/${deleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      toast({
        title: t("deleted"),
        status: "success",
        duration: 3000,
        position: "top",
      });

      const updatedList = await fetchData(currentPage);

      // 🔥 CHECK NEW LIST instead of old "list" state
      if (updatedList.length === 0 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }

      onClose();

    } catch (err) {
      toast({
        title: t("deleteFailed"),
        status: "error",
        duration: 3000,
        position: "top",
      });
    }
  };



  return (
    <Box bg="#F2F6F3" minH="100vh" p={10}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color="#1E4D2B" fontWeight="800">
          {t("certificates")}
        </Heading>

        <Button
          colorScheme="green"
          size="md"
          variant="solid"
          onClick={() => navigate("/dashboard")}
          rounded="lg"
        >
          ← {t("dashboard")}
        </Button>
      </Flex>

      <Box
        bg="white"
        p={6}
        rounded="2xl"
        shadow="lg"
        border="1px solid #E0E8E3"
      >
        {loading ? (
          <LoaderSpinner label={t("loading")} />
        ) : list.length === 0 ? (
          <Text fontSize="lg" color="gray.600" textAlign="center" py={10}>
            {t("noRecords")}
          </Text>
        ) : (
          <Table variant="simple" colorScheme="green">
            <Thead bg="#E8F3EC">
              <Tr>
                <Th fontSize="sm" color="#1E4D2B">{t("name")}</Th>
                <Th fontSize="sm" color="#1E4D2B">{t("age")}</Th>
                <Th fontSize="sm" color="#1E4D2B">{t("totalHeirs")}</Th>
                <Th fontSize="sm" color="#1E4D2B">{t("applicationDate")}</Th>
                <Th fontSize="sm" color="#1E4D2B">{t("status")}</Th>
                <Th fontSize="sm" color="#1E4D2B" textAlign="center">{t("actions")}</Th>
              </Tr>
            </Thead>

            <Tbody>
              {list.map((item) => (
                <Tr key={item._id} _hover={{ bg: "#F5FBF7" }} transition="0.2s">

                  <Td fontWeight="600">{item.mukhya?.name}</Td>
                  <Td>{item.mukhya?.age}</Td>
                  <Td>{item.heirs?.length}</Td>
                  <Td>{new Date(item.createdAt).toLocaleDateString()}</Td>

                  {/* STATUS COLUMN */}
                  <Td>
                    {item.hasFullForm ? (
                      <Badge colorScheme="green" rounded="full" px={3} py={1}>
                        {t("completed")}
                      </Badge>
                    ) : (
                      <Badge colorScheme="red" rounded="full" px={3} py={1}>
                        {t("pending")}
                      </Badge>
                    )}
                  </Td>

                  {/* ACTIONS COLUMN */}
                  <Td>
                    <HStack spacing={4} justify="center">

                      {/* View */}
                      <IconButton
                        size="sm"
                        icon={<ViewIcon />}
                        variant="ghost"
                        colorScheme="green"
                        rounded="full"
                        onClick={() => navigate(`/records/view/${item._id}`)}
                      />

                      {/* Edit */}
                      <IconButton
                        size="sm"
                        icon={<EditIcon />}
                        variant="ghost"
                        colorScheme="blue"
                        rounded="full"
                        onClick={() => navigate(`/pedhinamu/form/${item._id}?from=records`)}
                      />
                      <IconButton
                        size="sm"
                        icon={<DeleteIcon />}
                        variant="ghost"
                        colorScheme="red"
                        rounded="full"
                        onClick={() => {
                          setDeleteId(item._id);
                          onOpen();
                        }}
                      />

                    </HStack>
                  </Td>

                </Tr>
              ))}
            </Tbody>
          </Table>

        )}
      </Box>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />

      <Modal isOpen={isOpen} onClose={onClose} isCentered motionPreset="scale">
        <ModalOverlay bg="rgba(0,0,0,0.45)" />

        <ModalContent
          rounded="2xl"
          p={2}
          bg="white"
          shadow="2xl"
          border="1px solid #f2dede"
        >
          <ModalCloseButton />

          {/* Warning Icon */}
          <Flex justify="center" mt={6}>
            <Flex
              bg="red.100"
              w="70px"
              h="70px"
              rounded="full"
              align="center"
              justify="center"
              border="2px solid #fc8181"
            >
              <Text fontSize="4xl" color="red.600">⚠️</Text>
            </Flex>
          </Flex>

          {/* Header */}
          <ModalHeader
            textAlign="center"
            mt={4}
            fontSize="2xl"
            fontWeight="800"
            color="red.600"
          >
            {t("deleteTitle")}
          </ModalHeader>

          {/* Main Text */}
          <ModalBody pb={6}>
            <Text
              fontSize="lg"
              textAlign="center"
              color="gray.700"
              px={4}
              lineHeight="1.7"
            >
              {t("deleteConfirmFull")}
            </Text>
          </ModalBody>
          <ModalBody pb={6}>
            <Text
              fontSize="lg"
              textAlign="center"
              color="gray.700"
              px={4}
              lineHeight="1.7"
            >
              {t("deleteAffectsBoth")}
            </Text>
          </ModalBody>

          {/* Action Buttons */}
          <ModalFooter justifyContent="center" gap={4} pb={6}>
            <Button
              variant="outline"
              onClick={onClose}
              rounded="full"
              px={8}
              size="lg"
            >
              {t("cancel")}
            </Button>

            <Button
              colorScheme="red"
              rounded="full"
              px={8}
              size="lg"
              onClick={deleteRecord}
            >
              {t("delete")}
            </Button>
          </ModalFooter>

        </ModalContent>
      </Modal>
    </Box>
  );
}