"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  Text,
  Spinner,
  HStack,
  IconButton,
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  InputGroup,
  InputLeftElement,
  Select,
  Badge,
   Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalFooter, ModalCloseButton,useDisclosure
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";
import { EditIcon, CheckIcon, CloseIcon, SearchIcon } from "@chakra-ui/icons";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import Pagination from "../components/Pagination";
import { ViewIcon } from "@chakra-ui/icons";
import { useTranslation } from "react-i18next";



const CashMelDetails = () => {
    const { t } = useTranslation();
  
  const { id } = useParams();
  const toast = useToast();

  const [entry, setEntry] = useState(null);
  const [allEntries, setAllEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [originalEntry, setOriginalEntry] = useState(null);
  const [editMode, setEditMode] = useState({});
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);






  const API_ROOT = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
    : "http://localhost:5000/api";
  const API_BASE = `${API_ROOT}/cashmel`;


  const deleteRecord = async () => {
    try {
      
      const url = `${API_BASE}/delete/${deleteId}`;
      
      setDeleting(true);

      const res = await fetch(url, {
        method: "DELETE",
      });

      if (!res.ok) {
        let body = null;
        try { body = await res.json(); } catch { body = await res.text(); }
        console.error("Delete failed", res.status, body);
        throw new Error(body?.message || `Delete failed: ${res.status}`);
      }

      toast({
       title: t("deleteSuccess"),
        status: "success",
        duration: 2000,
        position: "top",
      });

      setFilteredEntries((prev) => prev.filter((x) => x._id !== deleteId));
      onClose();
    } catch (err) {
      console.error("Delete error", err);
      toast({
      title: t("deleteError"),
        status: "error",
        duration: 2000,
        position: "top",
      });
    } finally {
      setDeleting(false);
    }
  };

  // const itemsPerPage = 10;

  // report rows state (used when fetching report endpoints)
  const [rows, setRows] = useState([]);
  // simple placeholder for any custom categories (if you later add UI to manage these)
  const customCategories = { aavak: [], javak: [] };

  // Fetch all entries when ID is not provided
  useEffect(() => {
    if (!id) {
      setLoading(true);
      fetch(API_BASE)
        .then((res) => res.json())
        .then((data) => {
          setAllEntries(data.data || []);
          setFilteredEntries(data.data || []);
        })
        .catch(() =>
          toast({
            title: "Failed to load entries",
            status: "error",
            duration: 3000,
            position: "top",
          })
        )
        .finally(() => setLoading(false));
    }
  }, [id, API_BASE, toast]);

  // Filter entries based on search and type
  useEffect(() => {
    if (!id) {
      let filtered = allEntries;

      // Filter by vyavhar type
      if (filterType !== "all") {
        filtered = filtered.filter(
          (entry) => entry.vyavharType?.toLowerCase() === filterType
        );
      }

      // Filter by search term
      if (searchTerm) {
        filtered = filtered.filter(
          (entry) =>
            entry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.receiptPaymentNo?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setFilteredEntries(filtered);
      setTotalPages(Math.ceil(filtered.length / itemsPerPage));
      setCurrentPage(1); // Reset to first page when filter changes
    }
  }, [searchTerm, filterType, allEntries, id]);

  // Get paginated data
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredEntries.slice(startIndex, endIndex);
  };

  // Fetch single entry
  useEffect(() => {
    if (id) {
      setLoading(true);
      fetch(`${API_BASE}/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setEntry(data.data);
          setOriginalEntry(data.data);
        })
        .catch(() =>
          toast({
        title: t("loadEntryError"),
            status: "error",
            duration: 3000,
            position: "top",
          })
        )
        .finally(() => setLoading(false));
    }
  }, [id, API_BASE, toast]);

  // Save/Update
  const handleSave = async () => {
    if (!entry) return;

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("date", entry.date);
      fd.append("name", entry.name);
      fd.append("receiptPaymentNo", entry.receiptPaymentNo);
      fd.append("vyavharType", entry.vyavharType);
      fd.append("category", entry.category);
      fd.append("amount", entry.amount);

      const res = await fetch(`${API_BASE}/${id}`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) throw new Error();

      toast({
        title: t("updateCashmel"),
        status: "success",
        duration: 2000,
        position: "top",
      });
    } catch {
      toast({
       title: t("updateError"),
        status: "error",
        duration: 2000,
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  /* --------- Helpers & Print functions for Aavak/Javak reports --------- */
  const toGujaratiDigits = (num) => {
    if (!num && num !== 0) return "";
    const guj = ["૦", "૧", "૨", "૩", "૪", "૫", "૬", "૭", "૮", "૯"];
    return String(num).split("").map((d) => guj[d] || d).join("");
  };

  const formatDateToGujarati = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${toGujaratiDigits(day)}/${toGujaratiDigits(month)}/${toGujaratiDigits(year)}`;
  };

 

  // ------------------------------
  //     DESIGN FOR LIST PAGE
  // ------------------------------

  if (!id) {
    return (
      <Box bg="#F8FAF9" minH="100vh" p={10}>
        {/* HEADER */}
       


         <Flex justify="space-between" align="center" mb={10}>
       <Heading size="lg" color="#1E4D2B" fontWeight="700">
  💰 {t("cashmelDetails")}
</Heading>


        <Button
          leftIcon={<FiArrowLeft />}
          colorScheme="green"
          variant="outline"
          onClick={() => navigate("/cashmelform")}
        >
         {t("goBack")}
        </Button>
      </Flex>

        <Box
          bg="white"
          p={6}
          rounded="2xl"
          shadow="md"
          border="1px solid #E3EDE8"
          mb={6}
        >
          <Heading size="md" color="green.700" mb={4}>
            {/* કુલ એન્ટ્રીઓ: */}
            {t("totalEntries")} :  {filteredEntries.length}
          </Heading>
          
          {/* Search and Filter */}
          <Flex gap={4} flexWrap="wrap">
            <InputGroup maxW="400px">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="નામ, કેટેગરી ,અથવા રશીદ નંબર શોધો..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                bg="white"
              />
            </InputGroup>

            <Select
              maxW="200px"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              bg="white"
            >
              <option value="all">{t("all")}</option>
              <option value="aavak">{t("aavak")}</option>
              <option value="javak">{t("javak")}</option>
            </Select>
          </Flex>
        </Box>

        {loading ? (
          <Flex justify="center" py={10}>
            <Spinner size="xl" />
          </Flex>
        ) : (
          <>
            <TableContainer
              bg="white"
              rounded="2xl"
              shadow="lg"
              border="1px solid #E3EDE8"
              p={4}
            >
              <Table>
                <Thead bg="green.50">
                 <Tr>
  <Th>{t("fieldDate")}</Th>
  <Th>{t("fieldName")}</Th>
  <Th>{t("fieldReceiptPaymentNo")}</Th>
  <Th>{t("fieldVyavharType")}</Th>
  <Th>{t("category")}</Th>
  <Th isNumeric>{t("fieldAmount")}</Th>
  <Th>{t("actions")}</Th>
</Tr>

                </Thead>

              <Tbody>
  {getPaginatedData().map((row) => (
    <Tr
      key={row._id}
      _hover={{ bg: "gray.50" }}
      cursor="pointer"
      onClick={() => navigate(`/cashmel/details/${row._id}`)}
    >
      <Td>{formatDateToGujarati(row.date)}</Td>
      <Td>{row.name}</Td>
      <Td>{toGujaratiDigits(row.receiptPaymentNo)}</Td>
      <Td>
        <Badge
  colorScheme={row.vyavharType?.toLowerCase() === "aavak" ? "green" : "red"}
  rounded="full"
  px={3}
  py={1}
>
  {row.vyavharType?.toLowerCase() === "aavak"
    ? t("aavak")
    : t("javak")}
</Badge>

      </Td>
      <Td>{row.category}</Td>

      {/* Gujarati amount */}
      <Td isNumeric>₹{toGujaratiDigits(row.amount)}</Td>

   <Td>
  <HStack spacing={2}>
    {/* 👁️ VIEW BUTTON (same as your other component) */}
  <IconButton
  size="sm"
  icon={<ViewIcon />}
  variant="ghost"
  colorScheme="green"
  rounded="full"
  onClick={(e) => {
    e.stopPropagation();
    navigate(`/cashmel/view/${row._id}`);
  }}
/>


    {/* ✏️ EDIT BUTTON */}
    <IconButton
      size="sm"
      icon={<EditIcon />}
      variant="ghost"
      colorScheme="blue"
      rounded="full"
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/cashmel/details/${row._id}`);
      }}
    />

    <IconButton
  size="sm"
  icon={<DeleteIcon />}
  variant="ghost"
  colorScheme="red"
  rounded="full"
  onClick={(e) => {
    e.stopPropagation();
    setDeleteId(row._id);
    onOpen();
  }}
/>

  </HStack>
</Td>

    </Tr>
  ))}
</Tbody>

              </Table>
            </TableContainer>

            {totalPages > 1 && (
            <Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={(page) => setCurrentPage(page)}
  itemsPerPage={itemsPerPage}
  setItemsPerPage={setItemsPerPage}
/>


            )}
          </>
        )}
          {/* Delete Confirmation Modal (also used in single-entry view) */}
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
                  isLoading={deleting}
                  loadingText="Deleting"
                >
                  {t("delete")}
                </Button>
              </ModalFooter>

            </ModalContent>
          </Modal>

        </Box>
    );
  }

  // ------------------------------
  //     DESIGN FOR SINGLE ENTRY PAGE
  // ------------------------------

  return (
    <Box bg="#F8FAF9" minH="100vh" p={10}>
      {/* HEADER */}
      <Flex justify="space-between" align="center" mb={10}>
        <Heading size="lg" color="#1E4D2B" fontWeight="700" mr={2}>
    ✏️ {t("updateCashmel")}
  </Heading>

       <Button
  leftIcon={<FiArrowLeft />}
  colorScheme="green"
  variant="outline"
  onClick={() => navigate("/cashmel/details")}
>
  {t("goBack")}
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
        {loading ? (
          <Flex justify="center" py={10}>
            <Spinner size="xl" />
          </Flex>
        ) : entry ? (
          <VStack spacing={5} align="stretch">
            {/* --- Reusable Input Row --- */}
            {[
            
  { label: t("fieldDate"), key: "date" },
  { label: t("fieldName"), key: "name" },
  { label: t("fieldReceiptPaymentNo"), key: "receiptPaymentNo" },
  { label: t("fieldVyavharType"), key: "vyavharType" },
  { label: t("category"), key: "category" },
  { label: t("fieldAmount"), key: "amount" },


            ].map(({ label, key }) => (
              <FormControl key={key}>
                <FormLabel fontWeight="600" color="green.800">
                  {label}
                </FormLabel>

                <Flex gap={3}>
                  <Input
                    type={key === "amount" ? "number" : "text"}
                    value={entry[key] || ""}
                    isDisabled={!editMode[key]}
                    onChange={(e) =>
                      setEntry({ ...entry, [key]: e.target.value })
                    }
                    bg={editMode[key] ? "green.50" : "white"}
                  />

                  {!editMode[key] ? (
                    <IconButton
                      icon={<EditIcon />}
                      colorScheme="green"
                      variant="outline"
                      onClick={() => setEditMode({ ...editMode, [key]: true })}
                    />
                  ) : (
                    <>
                      <IconButton
                        icon={<CheckIcon />}
                        colorScheme="green"
                        variant="solid"
                        onClick={() =>
                          setEditMode({ ...editMode, [key]: false })
                        }
                      />
                      <IconButton
                        icon={<CloseIcon />}
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => {
                          setEntry({
                            ...entry,
                            [key]: originalEntry[key],
                          });
                          setEditMode({ ...editMode, [key]: false });
                        }}
                      />
                    </>
                  )}
                </Flex>
              </FormControl>
            ))}

          <Button
  colorScheme="green"
  size="lg"
  rounded="lg"
  onClick={handleSave}
  isLoading={loading}
>
  {t("saveChanges")}
</Button>

          </VStack>
        ) : (
          <Text>No data found</Text>
        )}
      </Box>
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
              isLoading={deleting}
              loadingText="Deleting"
            >
              {t("delete")}
            </Button>
          </ModalFooter>

        </ModalContent>
      </Modal>
    </Box>

 

  );
};

export default CashMelDetails;