"use client";

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  Box,
  useToast
} from "@chakra-ui/react";

export default function PaymentPopup({ isOpen, onClose, type }) {
  const toast = useToast();

  const handlePayment = () => {
    toast({
      title: "ભૂલ",
      description: "ઑનલાઇન પેમેન્ટ હજુ ઉપલબ્ધ નથી. કૃપા કરીને એડમિનને રૂપિયા નગદ આપો.",
      status: "info",
      duration: 5000,
      isClosable: true,
      position: "top"
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color="#1e293b" textAlign="center">
          {type === "module" ? "મોડ્યુલ ઍક્સેસ માટે પેમેન્ટ જરૂરી" : "પ્રિન્ટ માટે પેમેન્ટ જરૂરી"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="center">
            <Box textAlign="center">
              <Text fontSize="lg" color="gray.700" mb={2}>
                {type === "module" 
                  ? "તમારી 7 દિવસની ટ્રાયલ પીરિયડ સમાપ્ત થઈ ગઈ છે."
                  : "તમે 5 ફ્રી પ્રિન્ટ્સની મર્યાદા પાર કરી ગયા છો."
                }
              </Text>
              <Text fontSize="md" color="gray.600">
                સિસ્ટમનો ઉપયોગ ચાલુ રાખવા માટે કૃપા કરીને પેમેન્ટ કરો.
              </Text>
            </Box>

            {/* <Box bg="yellow.50" p={4} rounded="md" w="full" textAlign="center">
              <Text fontSize="sm" color="yellow.800">
                💰 નોંધ: ઑનલાઇન પેમેન્ટ હજુ ઉપલબ્ધ નથી.
              </Text>
              <Text fontSize="sm" color="yellow.800">
                કૃપા કરીને એડમિનને રૂપિયા નગદ આપો અને એડમિન પેનલમાંથી એક્ટિવેટ કરાવો.
              </Text>
            </Box> */}

            {/* <Button
              colorScheme="blue"
              onClick={handlePayment}
              w="full"
            >
              પેમેન્ટ પ્રક્રિયા શરૂ કરો
            </Button> */}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}