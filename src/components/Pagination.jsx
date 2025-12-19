import React from "react";
import { HStack, Button, IconButton, Text, Flex, Select, Box } from "@chakra-ui/react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@chakra-ui/icons";


export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  setItemsPerPage,
}) {
  if (!totalPages) return null;

  const getVisiblePages = () => {
    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    if (currentPage > 3) pages.push("...");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let p = start; p <= end; p++) pages.push(p);

    if (currentPage < totalPages - 2) pages.push("...");

    pages.push(totalPages);

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    // <VStack spacing={4} mt={6}>
    //   {/* Pagination Buttons */}
    //   <HStack spacing={2} justify="center">
    //     {/* First */}
    //     <IconButton
    //       aria-label="First page"
    //       icon={<ArrowLeftIcon />}
    //       isDisabled={currentPage === 1}
    //       onClick={() => onPageChange(1)}
    //       size="sm"
    //       colorScheme="green"
    //       variant="ghost"
    //       rounded="full"
    //     />

    //     {/* Prev */}
    //     <IconButton
    //       aria-label="Previous page"
    //       icon={<ChevronLeftIcon />}
    //       isDisabled={currentPage === 1}
    //       onClick={() => onPageChange(Math.max(1, currentPage - 1))}
    //       size="sm"
    //       colorScheme="green"
    //       variant="ghost"
    //       rounded="full"
    //     />

    //     {/* Page Numbers */}
    //     {visiblePages.map((p, i) =>
    //       p === "..." ? (
    //         <Text key={i} px={2} color="gray.500">
    //           ...
    //         </Text>
    //       ) : (
    //         <Button
    //           key={i}
    //           size="sm"
    //           rounded="full"
    //           variant={p === currentPage ? "solid" : "outline"}
    //           colorScheme="green"
    //           onClick={() => onPageChange(p)}
    //         >
    //           {p}
    //         </Button>
    //       )
    //     )}

    //     {/* Next */}
    //     <IconButton
    //       aria-label="Next page"
    //       icon={<ChevronRightIcon />}
    //       isDisabled={currentPage === totalPages}
    //       onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
    //       size="sm"
    //       colorScheme="green"
    //       variant="ghost"
    //       rounded="full"
    //     />

    //     {/* Last */}
    //     <IconButton
    //       aria-label="Last page"
    //       icon={<ArrowRightIcon />}
    //       isDisabled={currentPage === totalPages}
    //       onClick={() => onPageChange(totalPages)}
    //       size="sm"
    //       colorScheme="green"
    //       variant="ghost"
    //       rounded="full"
    //     />
    //   </HStack>

    //   {/* Items Per Page Dropdown */}
    //   <Flex align="center" gap={3}>
    //     <Text fontSize="sm" color="gray.600">
    //       Show:
    //     </Text>

    //     <Select
    //       size="sm"
    //       width="80px"
    //       bg="white"
    //       value={itemsPerPage}
    //       onChange={(e) => setItemsPerPage(Number(e.target.value))}
    //     >
    //       <option value={10}>10</option>
    //       <option value={20}>20</option>
    //       <option value={50}>50</option>
    //       <option value={100}>100</option>
    //     </Select>

    //     <Text fontSize="sm" color="gray.600">
    //       per page
    //     </Text>
    //   </Flex>
    // </VStack>

    <Flex align="center" justify="space-between" mt={6}>
  {/* Left: Items per page dropdown */}
  <Flex align="center" gap={3}>
    <Text fontSize="sm" color="gray.600">
      Show:
    </Text>

    <Select
      size="sm"
      width="80px"
      bg="white"
      value={itemsPerPage}
      onChange={(e) => setItemsPerPage(Number(e.target.value))}
    >
      <option value={10}>10</option>
      <option value={20}>20</option>
      <option value={50}>50</option>
      <option value={100}>100</option>
    </Select>

    <Text fontSize="sm" color="gray.600">
      per page
    </Text>
  </Flex>

  {/* Center: Pagination Buttons */}
  <HStack spacing={2} justify="center" flex={1}>
    {/* First */}
    <IconButton
      aria-label="First page"
      icon={<ArrowLeftIcon />}
      isDisabled={currentPage === 1}
      onClick={() => onPageChange(1)}
      size="sm"
      colorScheme="green"
      variant="ghost"
      rounded="full"
    />

    {/* Prev */}
    <IconButton
      aria-label="Previous page"
      icon={<ChevronLeftIcon />}
      isDisabled={currentPage === 1}
      onClick={() => onPageChange(Math.max(1, currentPage - 1))}
      size="sm"
      colorScheme="green"
      variant="ghost"
      rounded="full"
    />

    {/* Page Numbers */}
    {visiblePages.map((p, i) =>
      p === "..." ? (
        <Text key={i} px={2} color="gray.500">
          ...
        </Text>
      ) : (
        <Button
          key={i}
          size="sm"
          rounded="full"
          variant={p === currentPage ? "solid" : "outline"}
          colorScheme="green"
          onClick={() => onPageChange(p)}
        >
          {p}
        </Button>
      )
    )}

    {/* Next */}
    <IconButton
      aria-label="Next page"
      icon={<ChevronRightIcon />}
      isDisabled={currentPage === totalPages}
      onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
      size="sm"
      colorScheme="green"
      variant="ghost"
      rounded="full"
    />

    {/* Last */}
    <IconButton
      aria-label="Last page"
      icon={<ArrowRightIcon />}
      isDisabled={currentPage === totalPages}
      onClick={() => onPageChange(totalPages)}
      size="sm"
      colorScheme="green"
      variant="ghost"
      rounded="full"
    />
  </HStack>

  {/* Right: Empty to balance Flex */}
  <Box w="100px" /> 
</Flex>

  );
}
