"use client";

import { useState, useEffect, useRef } from "react";
import {
    Box, Heading, FormControl, FormLabel, Input,
    Button, HStack, VStack, Checkbox, Text
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
import CameraCapture from "../components/CameraCapture";


const gujaratiToEnglishDigits = (str) => {
    return str.replace(/[૦-૯]/g, d => "૦૧૨૩૪૫૬૭૮૯".indexOf(d));
};


const formatMobile = (value) => {
    value = gujaratiToEnglishDigits(value);  // 🔥 Fix applied

    value = value.replace("+91", "").trim();
    const digits = value.replace(/\D/g, "").slice(0, 10);

    if (!digits) return "+91 ";

    if (digits.length <= 5) {
        return `+91 ${digits}`;
    }

    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
};



const formatAadhaar = (value) => {
    value = gujaratiToEnglishDigits(value);  // 🔥 Fix applied

    const digits = value.replace(/\D/g, "").slice(0, 12);
    return digits.replace(
        /(\d{4})(\d{1,4})?(\d{1,4})?/,
        (_, a, b, c) => [a, b, c].filter(Boolean).join("-")
    );
};


export default function FullForm() {
    const { id } = useParams();
    const { t } = useTranslation();
    const toast = useToast();
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        applicantName: "",
        applicantSurname: "",
        applicantMobile: "",
        applicantAadhaar: "",
        applicationDate: "",
        // deceasedPersonName: "",
        // deceasedPersonDate: "",
        // deceasedPersonAge: "",
        deceasedPersons: [],
        notaryName: "",
        notaryBookNo: "",
        notaryPageNo: "",
        notarySerialNo: "",
        notaryDate: "",
        referenceNo: "",
        mukkamAddress: "",
        jaminSurveyNo: "",
        jaminKhatano: "",
        reasonForPedhinamu: "",
        panch: [],
        talatiName: "",
        varasdarType: "alive",
        totalHeirsCount: "",
        javadNo: "",
        mukhyaName: "",
        mukhyaAge: "",
        heirs: [],
        documents: {
            affidavit: false,
            satbara: false,
            aadhaarCopy: false,
            govtForm: false,
            deathCertificate: false,
            panchResolution: false,
            panchWitness: false,
            otherDocument: ""
        },
    });

    const [params] = useSearchParams();
    const navigate = useNavigate();
    const [invalidFields, setInvalidFields] = useState({});
    const formRef = useRef({});
    const source = params.get("from");

    const handleBack = () => {
        if (source === "records") {
            navigate("/records");
        } else {
            navigate("/pedhinamu/list");
        }
    };

    const handleChange = (key, value) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const updateDocument = (key, value) =>
        setForm(prev => ({
            ...prev,
            documents: { ...prev.documents, [key]: value }
        }));

    const updatePanch = (index, key, value) => {
        setForm(prev => {
            const updated = [...prev.panch];
            updated[index][key] = value;
            return { ...prev, panch: updated };
        });
    };

    useEffect(() => {
        (async () => {
            const res = await fetch(`http://localhost:5000/api/pedhinamu/${id}`);
            const data = await res.json();

            const ped = data.pedhinamu;
            const savedForm = data.form || {};

            if (!ped) return;

            const mukhya = ped.mukhya || {};
            const heirs = ped.heirs || [];

            /* ----------------------------------------------------
               COUNT DECEASED IN ENTIRE FAMILY TREE (ALL LEVELS)
            ---------------------------------------------------- */
            let deceasedCount = mukhya.isDeceased ? 1 : 0;

            heirs.forEach(h => {
                if (h.isDeceased) deceasedCount++;

                if (h.subFamily?.spouse?.isDeceased) deceasedCount++;

                (h.subFamily?.children || []).forEach(c => {
                    if (c.isDeceased) deceasedCount++;

                    if (c.spouse?.isDeceased) deceasedCount++;

                    (c.children || []).forEach(gc => {
                        if (gc.isDeceased) deceasedCount++;
                    });
                });
            });

            /* ----------------------------------------------------
               DECEASED PERSON NAME (if mukhya alive → heir's name)
            ---------------------------------------------------- */
            const deceasedPersonName = mukhya.isDeceased
                ? mukhya.name
                : heirs.find(h => h.isDeceased)?.name || "";

            /* ----------------------------------------------------
               AUTOFILL APPLICANT (if not already saved)
            ---------------------------------------------------- */
            const applicantName = savedForm.applicantName || mukhya.name || "";
            const applicantSurname = savedForm.applicantSurname ||
                (mukhya.name ? mukhya.name.split(" ").slice(-1)[0] : "");
            const applicantMobile = savedForm.applicantMobile || mukhya.mobile || "";
            const applicantAadhaar = savedForm.applicantAadhaar || "";

            /* ----------------------------------------------------
               MAP ALL DOB / DOB DISPLAY / DOD / DOD DISPLAY
               For: heirs, spouses, children, grandchildren
            ---------------------------------------------------- */
            const mappedHeirs = heirs.map(h => ({
                ...h,
                dob: h.dob || "",
                dobDisplay: h.dobDisplay || "",
                dod: h.dod || "",
                dodDisplay: h.dodDisplay || "",

                subFamily: {
                    spouse: h.subFamily?.spouse
                        ? {
                            ...h.subFamily.spouse,
                            dob: h.subFamily.spouse.dob || "",
                            dobDisplay: h.subFamily.spouse.dobDisplay || "",
                            dod: h.subFamily.spouse.dod || "",
                            dodDisplay: h.subFamily.spouse.dodDisplay || "",
                        }
                        : {},

                    children: (h.subFamily?.children || []).map(c => ({
                        ...c,
                        dob: c.dob || "",
                        dobDisplay: c.dobDisplay || "",
                        dod: c.dod || "",
                        dodDisplay: c.dodDisplay || "",

                        spouse: c.spouse
                            ? {
                                ...c.spouse,
                                dob: c.spouse.dob || "",
                                dobDisplay: c.spouse.dobDisplay || "",
                                dod: c.spouse.dod || "",
                                dodDisplay: c.spouse.dodDisplay || "",
                            }
                            : null,

                        children: (c.children || []).map(gc => ({
                            ...gc,
                            dob: gc.dob || "",
                            dobDisplay: gc.dobDisplay || "",
                            dod: gc.dod || "",
                            dodDisplay: gc.dodDisplay || "",
                        }))
                    }))
                }
            }));

            /* ----------------------------------------------------
               PANCH – ALWAYS 3 EMPTY ROWS
            ---------------------------------------------------- */
            const blankPanch = [
                { name: "", age: "", occupation: "", aadhaar: "", mobile: "" },
                { name: "", age: "", occupation: "", aadhaar: "", mobile: "" },
                { name: "", age: "", occupation: "", aadhaar: "", mobile: "" }
            ];


            function getAllDeceased(mukhya, heirs) {
                const list = [];

                if (mukhya.isDeceased) list.push(mukhya);

                heirs.forEach(h => {
                    if (h.isDeceased) list.push(h);

                    if (h.subFamily?.spouse?.isDeceased) list.push(h.subFamily.spouse);

                    (h.subFamily?.children || []).forEach(c => {
                        if (c.isDeceased) list.push(c);

                        if (c.spouse?.isDeceased) list.push(c.spouse);

                        (c.children || []).forEach(gc => {
                            if (gc.isDeceased) list.push(gc);
                        });
                    });
                });

                return list;
            }


            const deceasedList = getAllDeceased(mukhya, heirs);
            function toISO(dateStr) {
                if (!dateStr) return "";
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
                if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
                    const [dd, mm, yyyy] = dateStr.split("/");
                    return `${yyyy}-${mm}-${dd}`;
                }
                return "";
            }


            /* ----------------------------------------------------
               FINAL SET FORM
            ---------------------------------------------------- */
            setForm(prev => ({
                ...prev,
                ...savedForm,

                /* Applicant autofill */
                applicantName,
                applicantSurname,
                applicantMobile,
                applicantAadhaar,

                /* Deceased persons (supports multiple) */
                deceasedPersons: deceasedList.map(p => ({
                    name: p.name,
                    age: p.age || "",
                    date: toISO(p.dodDisplay || p.dod || "")
                })),

                /* Varasdar type = if at least 1 deceased exists */
                varasdarType: deceasedList.length > 0 ? "deceased" : "alive",



                /* Family */
                mukhyaName: mukhya.name || "",
                mukhyaAge: mukhya.age || "",
                heirs: mappedHeirs,

                /* Counts */
                totalHeirsCount: heirs.length,
                totalDeceasedCount: deceasedCount,

                /* Panch */
                panch:
                    savedForm.panch && savedForm.panch.length > 0
                        ? savedForm.panch.map(p => ({
                            name: p.name || "",
                            age: p.age || "",
                            occupation: p.occupation || "",
                            aadhaar: p.aadhaar || "",
                            mobile: p.mobile || ""
                        }))
                        : [
                            { name: "", age: "", occupation: "", aadhaar: "", mobile: "" },
                            { name: "", age: "", occupation: "", aadhaar: "", mobile: "" },
                            { name: "", age: "", occupation: "", aadhaar: "", mobile: "" }
                        ]
            }));

            setLoading(false);
        })();
    }, []);


    const handleSave = async () => {
        const errors = [];
        const invalid = {};
        const isEmpty = (v) => !v || !String(v).trim();

        // -----------------------------
        // Applicant Validation
        // -----------------------------
        if (isEmpty(form.applicantName)) {
            errors.push(t("enterApplicantName"));
            invalid.applicantName = t("requiredField");
        }

        if (isEmpty(form.applicantSurname)) {
            errors.push(t("enterApplicantSurname"));
            invalid.applicantSurname = t("requiredField");
        }

        let mobileDigits = form.applicantMobile.replace(/\D/g, "");

        if ((mobileDigits.startsWith("91") || mobileDigits.startsWith("091")) && mobileDigits.length > 10) {
            mobileDigits = mobileDigits.slice(mobileDigits.length - 10);
        }

        if (mobileDigits.length !== 10) {
            errors.push(t("invalidMobile"));
            invalid.applicantMobile = t("invalidMobile");
        }

        const aadhaarDigits = form.applicantAadhaar.replace(/\D/g, "");
        if (aadhaarDigits === "" || aadhaarDigits.length !== 12) {
            errors.push(t("invalidAadhaar"));
            invalid.applicantAadhaar = t("invalidAadhaar");
        }
        // -----------------------------
        // Aadhaar Duplicate Validation
        // -----------------------------

        const applicantA = form.applicantAadhaar.replace(/\D/g, "");
        const panchAadhaars = form.panch.map(p => p.aadhaar.replace(/\D/g, ""));

        // CHECK 1: APPLICANT Aadhaar should NOT match any PANCH Aadhaar
        if (panchAadhaars.includes(applicantA)) {
            toast({
                title: t("error"),
                description: t("aadhaarDuplicateApplicant"),
                status: "error",
                duration: 3000,
                position: "top"
            });
            return;
        }

        // CHECK 2: PANCH Aadhaar must be UNIQUE
        const duplicatePanchAadhar = panchAadhaars.find((a, i) =>
            a && panchAadhaars.indexOf(a) !== i
        );

        if (duplicatePanchAadhar) {
            toast({
                title: t("error"),
                description: t("aadhaarDuplicatePanch"),
                status: "error",
                duration: 3000,
                position: "top"
            });
            return;
        }

        // -----------------------------
        //  Panch Validation
        // -----------------------------
        form.panch.forEach((p, i) => {
            if (isEmpty(p.name)) {
                errors.push(`${t("panchNameMissing")} #${i + 1}`);
                invalid[`panch_${i}_name`] = t("panchNameMissing");
            }

            if (isEmpty(p.age)) {
                errors.push(`${t("panchAgeMissing")} #${i + 1}`);
                invalid[`panch_${i}_age`] = t("panchAgeMissing");
            }

            if (isEmpty(p.occupation)) {
                errors.push(`${t("panchOccupationMissing")} #${i + 1}`);
                invalid[`panch_${i}_occupation`] = true;
            }

            let pm = p.mobile.replace(/\D/g, "");
            if ((pm.startsWith("91") || pm.startsWith("091")) && pm.length > 10) {
                pm = pm.slice(pm.length - 10);
            }

            if (pm && pm.length !== 10) {
                errors.push(`${t("panchMobileInvalid")} #${i + 1}`);
                invalid[`panch_${i}_mobile`] = t("panchMobileInvalid");
            }

            const pa = p.aadhaar.replace(/\D/g, "");
            if (pa === "" || pa.length !== 12) {
                errors.push(`${t("panchAadhaarInvalid")} #${i + 1}`);
                invalid[`panch_${i}_aadhaar`] = t("panchAadhaarInvalid");
            }
        });

        // -----------------------------
        //  Notary Validation
        // -----------------------------
        if (isEmpty(form.notaryName)) {
            errors.push(t("enterNotaryName"));
            invalid.notaryName = t("requiredField");
        }

        if (isEmpty(form.notaryBookNo)) {
            errors.push(t("enterNotaryBookNo"));
            invalid.notaryBookNo = t("requiredField");
        }

        if (isEmpty(form.notaryPageNo)) {
            errors.push(t("enterNotaryPageNo"));
            invalid.notaryPageNo = t("requiredField");
        }

        if (isEmpty(form.notarySerialNo)) {
            errors.push(t("enterNotarySerialNo"));
            invalid.notarySerialNo = t("requiredField");
        }

        if (isEmpty(form.notaryDate)) {
            errors.push(t("enterNotaryDate"));
            invalid.notaryDate = t("requiredField");
        }

        // -----------------------------
        // Purpose / Address / Survey
        // -----------------------------
        if (isEmpty(form.mukkamAddress)) {
            errors.push(t("enterAddress"));
            invalid.mukkamAddress = t("requiredField");
        }

        if (isEmpty(form.jaminSurveyNo)) {
            errors.push(t("enterSurveyNo"));
            invalid.jaminSurveyNo = t("requiredField");
        }

        if (isEmpty(form.jaminKhatano)) {
            errors.push(t("enterKhataNo"));
            invalid.jaminKhatano = t("requiredField");
        }

        if (isEmpty(form.reasonForPedhinamu)) {
            errors.push(t("enterReason"));
            invalid.reasonForPedhinamu = t("requiredField");
        }

        // -----------------------------
        //  Talati Section
        // -----------------------------
        if (isEmpty(form.talatiName)) {
            errors.push(t("enterTalatiName"));
            invalid.talatiName = t("requiredField");
        }

        if (isEmpty(form.javadNo)) {
            errors.push(t("enterJavadNo"));
            invalid.javadNo = t("requiredField");
        }

        // -----------------------------
        // Save invalid fields
        // -----------------------------
        setInvalidFields(invalid);

        // -----------------------------
        // If any Error → Show FIRST error
        // -----------------------------
        if (errors.length > 0) {
            toast({
                title: t("error"),
                description: errors[0],
                status: "error",
                isClosable: true,
                duration: 3000,
                position: "top",
            });
            return;
        }

        // -----------------------------
        // CLEAN DATA BEFORE SENDING
        // -----------------------------
        const cleanForm = {
            ...form,
            applicantMobile: form.applicantMobile.replace(/\D/g, ""),
            applicantAadhaar: form.applicantAadhaar.replace(/\D/g, ""),
            panch: form.panch.map((p) => ({
                ...p,
                mobile: p.mobile.replace(/\D/g, ""),
                aadhaar: p.aadhaar.replace(/\D/g, "")
            }))
        };

        // -----------------------------
        // PREPARE FORM DATA FOR FILE UPLOADS
        // -----------------------------
        const formData = new FormData();
        
        // Clean panch data by removing photoFile before stringifying
        const panchDataForJson = cleanForm.panch.map(p => {
            const { photoFile, ...panchWithoutFile } = p;
            return panchWithoutFile;
        });
        
        // Add form data as JSON string
        formData.append('panch', JSON.stringify(panchDataForJson));
        
        // Add all other form fields
        Object.keys(cleanForm).forEach(key => {
            if (key !== 'panch') {
                // Serialize objects to JSON strings
                if (typeof cleanForm[key] === 'object' && cleanForm[key] !== null) {
                    formData.append(key, JSON.stringify(cleanForm[key]));
                } else {
                    formData.append(key, cleanForm[key]);
                }
            }
        });
        
        // Add panch photos
        form.panch.forEach((panch, index) => {
            if (panch.photoFile) {
                formData.append('panchPhotos', panch.photoFile);
            }
        });

        // -----------------------------
        // SEND TO API
        // -----------------------------
        const res = await fetch(
            `http://localhost:5000/api/pedhinamu/form/${id}`,
            {
                method: "POST",
                body: formData
            }
        );

        if (!res.ok) {
            toast({
                title: t("error"),
                status: "error",
                duration: 3000,
                position: "top",
            });
            return;
        }

        toast({
            title: t("success"),
            status: "success",
            duration: 3000,
            position: "top",
        });

        setTimeout(() => {
            navigate("/records");
        }, 900);
    };

    if (loading) return <Text p={10}>Loading...</Text>;

    const boxStyle = {
        p: 5,
        borderWidth: "1px",
        rounded: "xl",
        mb: 6,
        bg: "white",
        borderColor: "#D8E8DD",
        boxShadow: "sm"
    };

    const inputStyle = {
        bg: "#F6FBF7",
        border: "1px solid #CFE5D8",
        size: "lg",
        rounded: "lg",
        _focus: { borderColor: "#2A7F62", bg: "white" }
    };

    const sectionTitle = {
        size: "md",
        color: "#1E4D2B",
        mb: 2,
        fontWeight: "700",
        borderLeft: "5px solid #2A7F62",
        pl: 3
    };

    return (
        <Box p={8} maxW="1000px" mx="auto" bg="#F8FAF9">
            <Button
                leftIcon={<span>←</span>}
                colorScheme="green"
                variant="outline"
                mb={6}
                rounded="xl"
                fontWeight="700"
                onClick={handleBack}
            >
                {t("back")}
            </Button>

            <Heading textAlign="center" mb={10} color="#1E4D2B" fontWeight="800">
                {t("pedhinamu")}
            </Heading>

            {/* APPLICANT DETAILS */}
            <Heading {...sectionTitle}>{t("applicantDetails")}</Heading>
            <Box {...boxStyle}>

                <HStack spacing={6}>
                    <FormControl isRequired>
                        <FormLabel fontWeight="600">{t("applicantName")}</FormLabel>
                        <Input
                            {...inputStyle}
                            borderColor={invalidFields.applicantName ? "red.500" : "#CBD5E0"}
                            value={form.applicantName}
                            onChange={(e) => handleChange("applicantName", e.target.value)}
                        />
                    </FormControl>

                    <FormControl isRequired>
                        <FormLabel fontWeight="600">{t("applicantSurname")}</FormLabel>
                        <Input
                            {...inputStyle}
                            borderColor={invalidFields.applicantSurname ? "red.500" : "#CBD5E0"}
                            value={form.applicantSurname}
                            onChange={(e) => handleChange("applicantSurname", e.target.value)}
                        />
                    </FormControl>
                </HStack>

                <HStack spacing={6} mt={4}>
                    <FormControl isRequired>
                        <FormLabel fontWeight="600">{t("applicantMobile")}</FormLabel>
                        <Input
                            {...inputStyle}
                            borderColor={invalidFields.applicantMobile ? "red.500" : "#CBD5E0"}
                            value={form.applicantMobile}
                            onChange={(e) => handleChange("applicantMobile", formatMobile(e.target.value))}
                        />
                    </FormControl>

                    <FormControl isRequired>
                        <FormLabel fontWeight="600">{t("applicantAadhaar")}</FormLabel>
                        <Input
                            {...inputStyle}
                            borderColor={invalidFields.applicantAadhaar ? "red.500" : "#CBD5E0"}
                            value={form.applicantAadhaar}
                            onChange={(e) => handleChange("applicantAadhaar", formatAadhaar(e.target.value))}
                        />
                    </FormControl>
                </HStack>

            </Box>

            {/* PANCH */}
            <Heading {...sectionTitle}>{t("panchDetails")}</Heading>
            <Box {...boxStyle}>

                {form.panch.map((p, i) => (
                    <Box
                        key={i}
                        p={4}
                        borderWidth="1px"
                        rounded="md"
                        borderColor="#DDEDE2"
                        bg="#F8FBF9"
                        mb={4}
                    >
                        <Text fontWeight="700" color="#1E4D2B" mb={3}>
                            Panch #{i + 1}
                        </Text>

                        <HStack spacing={6}>
                            <FormControl isRequired>
                                <FormLabel fontWeight="600">{t("name")}</FormLabel>
                                <Input
                                    {...inputStyle}
                                    borderColor={invalidFields[`panch_${i}_name`] ? "red.500" : "#CBD5E0"}
                                    value={p.name}
                                    onChange={(e) => updatePanch(i, "name", e.target.value)}
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel fontWeight="600">{t("age")}</FormLabel>
                                <Input
                                    {...inputStyle}
                                    borderColor={invalidFields[`panch_${i}_age`] ? "red.500" : "#CBD5E0"}
                                    value={p.age}
                                    onChange={(e) => updatePanch(i, "age", e.target.value)}
                                />
                            </FormControl>
                        </HStack>

                        <HStack spacing={6} mt={4}>
                            <FormControl isRequired>
                                <FormLabel fontWeight="600">{t("occupation")}</FormLabel>
                                <Input
                                    {...inputStyle}
                                    borderColor={invalidFields[`panch_${i}_occupation`] ? "red.500" : "#CBD5E0"}
                                    value={p.occupation}
                                    onChange={(e) => updatePanch(i, "occupation", e.target.value)}
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel fontWeight="600">{t("aadhaarShort")}</FormLabel>
                                <Input
                                    {...inputStyle}
                                    borderColor={invalidFields[`panch_${i}_aadhaar`] ? "red.500" : "#CBD5E0"}
                                    value={p.aadhaar}
                                    onChange={(e) => updatePanch(i, "aadhaar", formatAadhaar(e.target.value))}
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel fontWeight="600">{t("mobile")}</FormLabel>
                                <Input
                                    {...inputStyle}
                                    borderColor={invalidFields[`panch_${i}_mobile`] ? "red.500" : "#CBD5E0"}
                                    value={p.mobile}
                                    onChange={(e) => updatePanch(i, "mobile", formatMobile(e.target.value))}
                                />
                            </FormControl>
                        </HStack>

                        {/* PHOTO UPLOAD */}
                        <FormControl mt={4}>
                            <FormLabel fontWeight="600">પંચની ફોટો</FormLabel>
                          <Input
  type="file"
  accept="image/*"
  capture="environment"   // 📸 Mobile camera
  onChange={(e) => {
    const file = e.target.files[0];
    if (file) {
      updatePanch(i, "photoFile", file);

      // preview ke liye
      updatePanch(i, "photoPreview", URL.createObjectURL(file));
    }
  }}
  sx={{
    "::file-selector-button": {
      height: 10,
      padding: "0 10px",
      borderRadius: "6px",
      backgroundColor: "#2A7F62",
      color: "white",
      border: "none",
      cursor: "pointer",
      marginRight: "10px"
    }
  }}
/>

                           {p.photoPreview && (
  <Box mt={3}>
    <img
      src={p.photoPreview}
      alt="Panch Photo"
      style={{
        width: "120px",
        height: "120px",
        objectFit: "cover",
        borderRadius: "8px",
        border: "1px solid #ccc"
      }}
    />
  </Box>
)}

<CameraCapture
  onCapture={(file) => {
    updatePanch(i, "photoFile", file);
    updatePanch(i, "photoPreview", URL.createObjectURL(file));
  }}
/>

                        </FormControl>
                    </Box>
                ))}

            </Box>

            {/* DECEASED — NO STAR, NO REQUIRED MARKS */}
            <Heading {...sectionTitle}>{t("deceasedDetails")}</Heading>
            <Box {...boxStyle}>
                {form.deceasedPersons?.length === 0 && (
                    <Text color="gray.600">{t("noDeceasedFound")}</Text>
                )}

                {form.deceasedPersons?.map((p, i) => (
                    <Box
                        key={i}
                        p={4}
                        mb={4}
                        borderWidth="1px"
                        rounded="lg"
                        bg="#F8FBF9"
                        borderColor="#DDEDE2"
                    >
                        <Text fontWeight="700" mb={3}>
                            {t("deceased")} #{i + 1}
                        </Text>

                        {/* NAME */}
                        <FormControl mb={3}>
                            <FormLabel fontWeight="600">{t("deceasedPersonName")}</FormLabel>
                            <Input
                                {...inputStyle}
                                value={p.name}
                                onChange={(e) => {
                                    const updated = [...form.deceasedPersons];
                                    updated[i].name = e.target.value;
                                    handleChange("deceasedPersons", updated);
                                }}
                            />
                        </FormControl>

                        <HStack spacing={6}>
                            {/* DATE */}
                            <FormControl>
                                <FormLabel fontWeight="600">{t("deathDate")}</FormLabel>
                                <Input
                                    {...inputStyle}
                                    type="date"
                                    value={p.date}
                                    onChange={(e) => {
                                        const updated = [...form.deceasedPersons];
                                        updated[i].date = e.target.value;
                                        handleChange("deceasedPersons", updated);
                                    }}
                                />
                            </FormControl>

                            {/* AGE */}
                            <FormControl>
                                <FormLabel fontWeight="600">{t("deceasedPersonAge")}</FormLabel>
                                <Input
                                    {...inputStyle}
                                    value={p.age}
                                    onChange={(e) => {
                                        const updated = [...form.deceasedPersons];
                                        updated[i].age = e.target.value;
                                        handleChange("deceasedPersons", updated);
                                    }}
                                />
                            </FormControl>
                        </HStack>
                    </Box>
                ))}
            </Box>


            {/* NOTARY */}
            <Heading {...sectionTitle}>{t("notaryDetails")}</Heading>
            <Box {...boxStyle}>

                <HStack spacing={6}>
                    <FormControl isRequired>
                        <FormLabel fontWeight="600">{t("notaryName")}</FormLabel>
                        <Input
                            {...inputStyle}
                            borderColor={invalidFields.notaryName ? "red.500" : "#CBD5E0"}
                            value={form.notaryName}
                            onChange={(e) => handleChange("notaryName", e.target.value)}
                        />
                    </FormControl>

                    <FormControl isRequired>
                        <FormLabel fontWeight="600">{t("notaryBookNo")}</FormLabel>
                        <Input
                            {...inputStyle}
                            borderColor={invalidFields.notaryBookNo ? "red.500" : "#CBD5E0"}
                            value={form.notaryBookNo}
                            onChange={(e) => handleChange("notaryBookNo", e.target.value)}
                        />
                    </FormControl>
                </HStack>

                <HStack spacing={6} mt={4}>
                    <FormControl isRequired>
                        <FormLabel fontWeight="600">{t("notaryPageNo")}</FormLabel>
                        <Input
                            {...inputStyle}
                            borderColor={invalidFields.notaryPageNo ? "red.500" : "#CBD5E0"}
                            value={form.notaryPageNo}
                            onChange={(e) => handleChange("notaryPageNo", e.target.value)}
                        />
                    </FormControl>

                    <FormControl isRequired>
                        <FormLabel fontWeight="600">{t("notarySerialNo")}</FormLabel>
                        <Input
                            {...inputStyle}
                            borderColor={invalidFields.notarySerialNo ? "red.500" : "#CBD5E0"}
                            value={form.notarySerialNo}
                            onChange={(e) => handleChange("notarySerialNo", e.target.value)}
                        />
                    </FormControl>

                    <FormControl isRequired>
                        <FormLabel fontWeight="600">{t("notaryDate")}</FormLabel>
                        <Input
                            {...inputStyle}
                            type="date"
                            borderColor={invalidFields.notaryDate ? "red.500" : "#CBD5E0"}
                            value={form.notaryDate}
                            onChange={(e) => handleChange("notaryDate", e.target.value)}
                        />
                    </FormControl>
                </HStack>

            </Box>

            {/* PURPOSE */}
            <Heading {...sectionTitle}>{t("useDetails")}</Heading>
            <Box {...boxStyle}>

                <FormControl isRequired mb={3}>
                    <FormLabel fontWeight="600">{t("referenceNo")}</FormLabel>
                    <Input
                        {...inputStyle}
                        borderColor={invalidFields.referenceNo ? "red.500" : "#CBD5E0"}
                        value={form.referenceNo}
                        onChange={(e) => handleChange("referenceNo", e.target.value)}
                    />
                </FormControl>

                <FormControl isRequired mb={3}>
                    <FormLabel fontWeight="600">{t("mukkamAddress")}</FormLabel>
                    <Input
                        {...inputStyle}
                        borderColor={invalidFields.mukkamAddress ? "red.500" : "#CBD5E0"}
                        value={form.mukkamAddress}
                        onChange={(e) => handleChange("mukkamAddress", e.target.value)}
                    />
                </FormControl>

                <HStack spacing={6}>
                    <FormControl isRequired>
                        <FormLabel fontWeight="600">{t("surveyNo")}</FormLabel>
                        <Input
                            {...inputStyle}
                            borderColor={invalidFields.jaminSurveyNo ? "red.500" : "#CBD5E0"}
                            value={form.jaminSurveyNo}
                            onChange={(e) => handleChange("jaminSurveyNo", e.target.value)}
                        />
                    </FormControl>

                    <FormControl isRequired>
                        <FormLabel fontWeight="600">{t("khataNo")}</FormLabel>
                        <Input
                            {...inputStyle}
                            borderColor={invalidFields.jaminKhatano ? "red.500" : "#CBD5E0"}
                            value={form.jaminKhatano}
                            onChange={(e) => handleChange("jaminKhatano", e.target.value)}
                        />
                    </FormControl>
                </HStack>

                <FormControl isRequired mt={3}>
                    <FormLabel fontWeight="600">{t("reasonForPedhinamu")}</FormLabel>
                    <Input
                        {...inputStyle}
                        borderColor={invalidFields.reasonForPedhinamu ? "red.500" : "#CBD5E0"}
                        value={form.reasonForPedhinamu}
                        onChange={(e) => handleChange("reasonForPedhinamu", e.target.value)}
                    />
                </FormControl>

            </Box>

            {/* DOCUMENTS */}
            <Heading {...sectionTitle}>{t("documents")}</Heading>
            <Box {...boxStyle}>
                <VStack align="start">

                    {Object.keys(form.documents).map((key) =>
                        key !== "otherDocument" ? (
                            <FormControl key={key} isRequired>
                                <Checkbox
                                    isChecked={form.documents[key]}
                                    onChange={(e) => updateDocument(key, e.target.checked)}
                                    colorScheme="green"
                                    borderColor={invalidFields[`doc_${key}`] ? "red.500" : undefined}
                                >
                                    {t(key)}
                                </Checkbox>
                            </FormControl>
                        ) : (
                            <FormControl key={key} mt={3}>
                                <FormLabel fontWeight="600">{t("otherDocument")}</FormLabel>
                                <Input
                                    {...inputStyle}
                                    borderColor={invalidFields.otherDocument ? "red.500" : "#CBD5E0"}
                                    value={form.documents.otherDocument}
                                    onChange={(e) => updateDocument("otherDocument", e.target.value)}
                                />
                            </FormControl>
                        )
                    )}

                </VStack>
            </Box>

            {/* TALATI */}
            <Heading {...sectionTitle}>{t("talatiSection")}</Heading>
            <Box {...boxStyle}>

                <FormControl isRequired mb={3}>
                    <FormLabel fontWeight="600">{t("talatiName")}</FormLabel>
                    <Input
                        {...inputStyle}
                        borderColor={invalidFields.talatiName ? "red.500" : "#CBD5E0"}
                        value={form.talatiName}
                        onChange={(e) => handleChange("talatiName", e.target.value)}
                    />
                </FormControl>

                <HStack spacing={6}>
                    <FormControl isRequired>
                        <FormLabel fontWeight="600">{t("varasdarType")}</FormLabel>
                        <Input
                            {...inputStyle}
                            borderColor={invalidFields.varasdarType ? "red.500" : "#CBD5E0"}
                            value={form.varasdarType}
                            onChange={(e) => handleChange("varasdarType", e.target.value)}
                        />
                    </FormControl>

                    <FormControl isRequired>
                        <FormLabel fontWeight="600">{t("totalHeirsCount")}</FormLabel>
                        <Input
                            {...inputStyle}
                            readOnly
                            value={form.totalHeirsCount}
                        />
                    </FormControl>

                    <FormControl isRequired>
                        <FormLabel fontWeight="600">{t("javadNo")}</FormLabel>
                        <Input
                            {...inputStyle}
                            borderColor={invalidFields.javadNo ? "red.500" : "#CBD5E0"}
                            value={form.javadNo}
                            onChange={(e) => handleChange("javadNo", e.target.value)}
                        />
                    </FormControl>
                </HStack>

            </Box>

            <Button
                size="lg"
                colorScheme="green"
                width="100%"
                rounded="xl"
                mt={8}
                onClick={handleSave}
            >
                {t("save")}
            </Button>
        </Box>
    );
}