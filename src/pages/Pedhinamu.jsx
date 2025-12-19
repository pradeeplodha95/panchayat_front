"use client";

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {
    Box, Button, Input, Heading, VStack, HStack,
    FormControl, FormLabel, Select, Text, Progress,
    Menu, MenuButton, MenuList, MenuItem, Divider
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { useToast } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import LoaderSpinner from "../components/LoaderSpinner";

export default function Pedhinamu() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;
    const { t } = useTranslation();
    // const formRef = useRef({});
    const toast = useToast();

    const showSuccess = (msg) =>
        toast({
            title: msg,
            status: "success",
            duration: 3000,
            isClosable: true,
            position: "top",
        });

    const showError = (msg) =>
        toast({
            title: msg,
            status: "error",
            duration: 3000,
            isClosable: true,
            position: "top",
        });

    const [step, setStep] = useState(1);
    const [totalHeirs, setTotalHeirs] = useState(0);

    const [form, setForm] = useState({
        mukhyaName: "",
        mukhyaAge: "",
        heirs: []
    });
    // Loader for edit mode
    const [initialLoading, setInitialLoading] = useState(!!id);

    const calculateAge = (dob) => {
        if (!dob) return "";
        const birth = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };
    // Converts user input "20 1 2004" → "2004-01-20"
    const formatDisplayDate = (value) => {
        // Keep digits only
        let v = value.replace(/\D/g, "");

        let d = v.slice(0, 2);
        let m = v.slice(2, 4);
        let y = v.slice(4, 8);

        let result = d;
        if (m) result += "/" + m;
        if (y) result += "/" + y;

        return result;
    };

    const convertToISO = (display) => {
        const parts = display.split("/");
        if (parts.length !== 3) return "";

        let [d, m, y] = parts;

        if (d.length !== 2 || m.length !== 2 || y.length !== 4) return "";

        return `${y}-${m}-${d}`;
    };

    const validateDob = (display) => {
        if (!display) return true;

        const parts = display.split("/");
        if (parts.length !== 3) return false;

        const [d, m, y] = parts;
        if (d.length !== 2 || m.length !== 2 || y.length !== 4) return false;

        const date = new Date(`${y}-${m}-${d}`);
        if (isNaN(date.getTime())) return false;

        // No future date
        if (date > new Date()) return false;

        return true;
    };


    const generateHeirs = (count) => {
        const items = Array.from({ length: count }, () => ({
            name: "",
            relation: "",
            age: "",
            mobile: "",
            isDeceased: false,

            showSubFamily: false,
            childCount: 0,

            subFamily: {
                spouse: {
                    name: "",
                    age: "",
                    relation: "",
                    // relation2: "",
                    isDeceased: false
                },
                children: []
            }
        }));
        setForm({ ...form, heirs: items });
    };


    const updateHeir = (i, key, value) => {
        const updated = [...form.heirs];
        updated[i][key] = value;
        setForm({ ...form, heirs: updated });
    };

    const relationList = [
        "son",
        "daughter",
        "grandson",
        "granddaughter",
        "great_grandson",
        "great_granddaughter",
        "dohitra",
        "dohitri",
        "first_wife",
        "wife",
        "husband",
        "second_wife",
        "third_wife",
    ];

    useEffect(() => {
        if (!id) return;

        setInitialLoading(true);

        fetch(`http://localhost:5000/api/pedhinamu/${id}`)
            .then(res => res.json())
            .then(json => {
                const p = json.pedhinamu;

                if (!p) {
                    setInitialLoading(false);
                    return;
                }

                if (p.hasFullForm) {
                    navigate(`/pedhinamu/form/${id}?from=records`);
                    return;
                }

                // Use fixed normalizer
                const formatted = normalizeForm(p);

                setForm(formatted);
                setTotalHeirs(formatted.heirs.length);
                setStep(formatted.heirs.length > 0 ? 2 : 1);

                setInitialLoading(false);
            })
            .catch(err => {
                console.error("Failed to load:", err);
                setInitialLoading(false);
            });
    }, [id]);


    const handleBack = () => {
        if (id) {
            // Editing mode → go back to list
            navigate("/pedhinamu/list");
        } else {
            // Creating new → go back to main home or list
            navigate(-1);
        }
    };

    const handleSave = async () => {
        try {
            // -----------------------------
            // VALIDATION HELPERS
            // -----------------------------
            const validateAge = (age) => !age || /^[0-9]{1,3}$/.test(age);

            // -----------------------------
            // MAIN PERSON VALIDATION
            // -----------------------------
            if (!form.mukhyaDobDisplay && !form.mukhyaAge) {
                showError(t("dobOrAgeRequired"));
                return;
            }

            if (form.mukhyaDobDisplay && !validateDob(form.mukhyaDobDisplay)) {
                showError(t("invalidDate"));
                return;
            }

            if (form.mukhyaAge && !validateAge(form.mukhyaAge)) {
                showError(t("invalidAge"));
                return;
            }

            if (
                form.mukhyaIsDeceased &&
                form.mukhyaDodDisplay &&
                !validateDob(form.mukhyaDodDisplay)
            ) {
                showError(t("invalidDate"));
                return;
            }

            // -----------------------------
            // VALIDATE HEIRS
            // -----------------------------
            for (let h of form.heirs) {

                if (!h.name?.trim()) continue;

                // ⭐ RELATION REQUIRED
                if (!h.relation?.trim()) {
                    showError(`${h.name}: ${t("heirRelationRequired")}`);
                    return;
                }

                // DOB or Age required
                if (!h.dobDisplay && !h.age) {
                    showError(`${h.name}: ${t("dobOrAgeRequired")}`);
                    return;
                }

                if (h.dobDisplay && !validateDob(h.dobDisplay)) {
                    showError(`${h.name}: ${t("invalidDate")}`);
                    return;
                }

                if (h.age && !validateAge(h.age)) {
                    showError(`${h.name}: ${t("invalidAge")}`);
                    return;
                }

                if (h.isDeceased && h.dodDisplay && !validateDob(h.dodDisplay)) {
                    showError(`${h.name}: ${t("invalidDate")}`);
                    return;
                }

                // -----------------------------
                // SPOUSE VALIDATION
                // -----------------------------
                if (h.subFamily?.spouse?.name?.trim()) {
                    const s = h.subFamily.spouse;

                    if (!s.relation?.trim()) {
                        showError(`${s.name}: ${t("spouseRelationRequired")}`);
                        return;
                    }

                    if (!s.dobDisplay && !s.age) {
                        showError(`${s.name}: ${t("dobOrAgeRequired")}`);
                        return;
                    }

                    if (s.dobDisplay && !validateDob(s.dobDisplay)) {
                        showError(`${s.name}: ${t("invalidDate")}`);
                        return;
                    }

                    if (s.age && !validateAge(s.age)) {
                        showError(`${s.name}: ${t("invalidAge")}`);
                        return;
                    }

                    if (s.isDeceased && s.dodDisplay && !validateDob(s.dodDisplay)) {
                        showError(`${s.name}: ${t("invalidDate")}`);
                        return;
                    }
                }

                // -----------------------------
                // CHILDREN VALIDATION
                // -----------------------------
                for (let c of h.subFamily.children || []) {

                    if (!c.name?.trim()) continue;

                    if (!c.relation?.trim()) {
                        showError(`${c.name}: ${t("childRelationRequired")}`);
                        return;
                    }

                    if (!c.dobDisplay && !c.age) {
                        showError(`${c.name}: ${t("dobOrAgeRequired")}`);
                        return;
                    }

                    if (c.dobDisplay && !validateDob(c.dobDisplay)) {
                        showError(`${c.name}: ${t("invalidDate")}`);
                        return;
                    }

                    if (c.age && !validateAge(c.age)) {
                        showError(`${c.name}: ${t("invalidAge")}`);
                        return;
                    }

                    if (c.isDeceased && c.dodDisplay && !validateDob(c.dodDisplay)) {
                        showError(`${c.name}: ${t("invalidDate")}`);
                        return;
                    }

                    // -----------------------------
                    // CHILD SPOUSE VALIDATION
                    // -----------------------------
                    const cs = c.spouse;

                    if (cs?.name?.trim()) {

                        if (!cs.relation?.trim()) {
                            showError(`${cs.name}: ${t("spouseRelationRequired")}`);
                            return;
                        }

                        if (!cs.dobDisplay && !cs.age) {
                            showError(`${cs.name}: ${t("dobOrAgeRequired")}`);
                            return;
                        }

                        if (cs.dobDisplay && !validateDob(cs.dobDisplay)) {
                            showError(`${cs.name}: ${t("invalidDate")}`);
                            return;
                        }

                        if (cs.age && !validateAge(cs.age)) {
                            showError(`${cs.name}: ${t("invalidAge")}`);
                            return;
                        }

                        if (cs.isDeceased && cs.dodDisplay && !validateDob(cs.dodDisplay)) {
                            showError(`${cs.name}: ${t("invalidDate")}`);
                            return;
                        }
                    }

                    // -----------------------------
                    // GRANDCHILDREN VALIDATION
                    // -----------------------------
                    for (let gc of c.children || []) {

                        if (!gc.name?.trim()) continue;

                        if (!gc.relation?.trim()) {
                            showError(`${gc.name}: ${t("grandchildRelationRequired")}`);
                            return;
                        }

                        if (!gc.dobDisplay && !gc.age) {
                            showError(`${gc.name}: ${t("dobOrAgeRequired")}`);
                            return;
                        }

                        if (gc.dobDisplay && !validateDob(gc.dobDisplay)) {
                            showError(`${gc.name}: ${t("invalidDate")}`);
                            return;
                        }

                        if (gc.age && !validateAge(gc.age)) {
                            showError(`${gc.name}: ${t("invalidAge")}`);
                            return;
                        }

                        if (gc.isDeceased && gc.dodDisplay && !validateDob(gc.dodDisplay)) {
                            showError(`${gc.name}: ${t("invalidDate")}`);
                            return;
                        }
                    }
                }
            }
            // -----------------------------
            // BUILD PAYLOAD AFTER VALIDATION
            // -----------------------------
            const payload = {
                mukhya: {
                    name: form.mukhyaName,
                    age: form.mukhyaAge,
                    dob: form.mukhyaDob || "",
                    dobDisplay: form.mukhyaDobDisplay || "",
                    isDeceased: form.mukhyaIsDeceased || false,
                    dod: form.mukhyaIsDeceased ? (form.mukhyaDod || "") : "",
                    dodDisplay: form.mukhyaIsDeceased ? (form.mukhyaDodDisplay || "") : ""
                },

                heirs: form.heirs.map((h) => ({
                    name: h.name,
                    relation: h.relation,
                    age: h.age,
                    dob: h.dob || "",
                    dobDisplay: h.dobDisplay || "",
                    mobile: h.mobile || "",
                    isDeceased: h.isDeceased || false,
                    dod: h.isDeceased ? (h.dod || "") : "",
                    dodDisplay: h.isDeceased ? (h.dodDisplay || "") : "",

                    subFamily: {
                        spouse: {
                            name: h.subFamily.spouse.name,
                            age: h.subFamily.spouse.age,
                            relation: h.subFamily.spouse.relation,
                            // relation2: h.subFamily.spouse.relation2 || "",
                            dob: h.subFamily.spouse.dob || "",
                            dobDisplay: h.subFamily.spouse.dobDisplay || "",
                            isDeceased: h.subFamily.spouse.isDeceased,
                            dod: h.subFamily.spouse.isDeceased
                                ? (h.subFamily.spouse.dod || "")
                                : "",
                            dodDisplay: h.subFamily.spouse.isDeceased
                                ? (h.subFamily.spouse.dodDisplay || "")
                                : ""
                        },

                        children: h.subFamily.children.map((c) => ({
                            name: c.name,
                            age: c.age,
                            relation: c.relation,
                            dob: c.dob || "",
                            dobDisplay: c.dobDisplay || "",
                            isDeceased: c.isDeceased || false,
                            dod: c.isDeceased ? (c.dod || "") : "",
                            dodDisplay: c.isDeceased ? (c.dodDisplay || "") : "",

                            spouse: c.spouse
                                ? {
                                    name: c.spouse.name || "",
                                    age: c.spouse.age || "",
                                    relation: c.spouse.relation || "",
                                    dob: c.spouse.dob || "",
                                    dobDisplay: c.spouse.dobDisplay || "",
                                    isDeceased: c.spouse.isDeceased || false,
                                    dod: c.spouse.isDeceased ? (c.spouse.dod || "") : "",
                                    dodDisplay: c.spouse.isDeceased
                                        ? (c.spouse.dodDisplay || "")
                                        : ""
                                }
                                : null,

                            children: (c.children || []).map((gc) => ({
                                name: gc.name,
                                age: gc.age,
                                relation: gc.relation,
                                dob: gc.dob || "",
                                dobDisplay: gc.dobDisplay || "",
                                isDeceased: gc.isDeceased || false,
                                dod: gc.isDeceased ? (gc.dod || "") : "",
                                dodDisplay: gc.isDeceased ? (gc.dodDisplay || "") : ""
                            }))
                        }))
                    }
                }))
            };

            // -----------------------------
            // DECIDE API METHOD (CREATE vs UPDATE)
            // -----------------------------
            const isEditMode = Boolean(id);
            const url = isEditMode
                ? `http://localhost:5000/api/pedhinamu/${id}`
                : `http://localhost:5000/api/pedhinamu`;

            const method = isEditMode ? "PUT" : "POST";
            

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: localStorage.getItem("token"),
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                showError(data.error || t("error"));
                return;
            }

            // SUCCESS
            showSuccess(isEditMode ? t("updateSuccess") : t("success"));

            setTimeout(() => {
                const redirectId = isEditMode ? id : data.data._id;
                navigate(`/pedhinamu/form/${redirectId}`);
            }, 500);

        } catch (err) {
            console.error("SAVE ERROR:", err);
            showError(t("error"));
        }
    };


    const normalizeForm = (p) => {
        if (!p) return null;

        return {
            // -------------------------
            // MAIN PERSON
            // -------------------------
            mukhyaName: p.mukhya?.name || "",
            mukhyaAge: p.mukhya?.age || "",
            mukhyaDob: p.mukhya?.dob || "",
            mukhyaDobDisplay: p.mukhya?.dobDisplay || "",
            mukhyaIsDeceased: p.mukhya?.isDeceased || false,
            mukhyaDod: p.mukhya?.dod || "",
            mukhyaDodDisplay: p.mukhya?.dodDisplay || "",

            // -------------------------
            // HEIRS
            // -------------------------
            heirs: (p.heirs || []).map((h) => ({
                name: h.name || "",
                relation: h.relation || "",
                age: h.age || "",
                dob: h.dob || "",
                dobDisplay: h.dobDisplay || "",
                mobile: h.mobile || "",
                isDeceased: h.isDeceased || false,
                dod: h.dod || "",
                dodDisplay: h.dodDisplay || "",
                showSubFamily: true,

                subFamily: {
                    spouse: {
                        name: h.subFamily?.spouse?.name || "",
                        age: h.subFamily?.spouse?.age || "",
                        relation: h.subFamily?.spouse?.relation || "",
                        // relation2: h.subFamily?.spouse?.relation2 || "",
                        dob: h.subFamily?.spouse?.dob || "",
                        dobDisplay: h.subFamily?.spouse?.dobDisplay || "",
                        isDeceased: h.subFamily?.spouse?.isDeceased || false,
                        dod: h.subFamily?.spouse?.dod || "",
                        dodDisplay: h.subFamily?.spouse?.dodDisplay || "",
                    },

                    children: (h.subFamily?.children || []).map((c) => ({
                        name: c.name || "",
                        relation: c.relation || "",
                        age: c.age || "",
                        dob: c.dob || "",
                        dobDisplay: c.dobDisplay || "",
                        isDeceased: c.isDeceased || false,
                        dod: c.dod || "",
                        dodDisplay: c.dodDisplay || "",
                        showSpouse: !!c.spouse?.name,

                        spouse: c.spouse
                            ? {
                                name: c.spouse?.name || "",
                                age: c.spouse?.age || "",
                                relation: c.spouse?.relation || "",
                                dob: c.spouse?.dob || "",
                                dobDisplay: c.spouse?.dobDisplay || "",
                                isDeceased: c.spouse?.isDeceased || false,
                                dod: c.spouse?.dod || "",
                                dodDisplay: c.spouse?.dodDisplay || "",
                            }
                            : {
                                name: "",
                                age: "",
                                relation: "",
                                dob: "",
                                dobDisplay: "",
                                isDeceased: false,
                                dod: "",
                                dodDisplay: ""
                            },

                        children: (c.children || []).map((gc) => ({
                            name: gc.name || "",
                            relation: gc.relation || "",
                            age: gc.age || "",
                            dob: gc.dob || "",
                            dobDisplay: gc.dobDisplay || "",
                            isDeceased: gc.isDeceased || false,
                            dod: gc.dod || "",
                            dodDisplay: gc.dodDisplay || "",
                        }))
                    })),
                }
            })),
        };
    };

    if (initialLoading) {
        return <LoaderSpinner label={t("loading")} />;
    }

    return (
        <Box p={8} maxW="900px" mx="auto" bg="#F8FAF9" minH="100vh">
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

            {/* Progress Bar */}
            <Progress
                value={step === 1 ? 50 : 100}
                size="sm"
                colorScheme="green"
                borderRadius="md"
                mb={6}
            />

            {/* Page Title */}
            <Heading textAlign="center" mb={6} color="#1E4D2B" fontWeight="700">
                {t("pedhinamu")}
            </Heading>

            {/* STEP 1 */}
            {step === 1 && (
                <Box p={6} bg="white" rounded="2xl" shadow="md" borderWidth="1px">

                    <Heading size="md" mb={4} color="green.700" borderLeft="4px solid #2A7F62" pl={3}>
                        {t("mukhyaDetails")}
                    </Heading>

                    <VStack spacing={4}>
                        <FormControl>
                            <FormLabel fontWeight="600">{t("name")}</FormLabel>
                            <Input
                                size="lg"
                                bg="gray.100"
                                value={form.mukhyaName}
                                onChange={(e) => setForm({ ...form, mukhyaName: e.target.value })}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontWeight="600">{t("birthDateAge")}</FormLabel>

                            <HStack spacing={3} align="center">

                                {/* DATE INPUT */}
                                <Input
                                    type="text"
                                    placeholder="DD/MM/YYYY"
                                    size="lg"
                                    bg="gray.100"
                                    value={form.mukhyaDobDisplay || ""}
                                    onChange={(e) => {
                                        const display = formatDisplayDate(e.target.value);

                                        // Validate only when full DD/MM/YYYY entered
                                        if (display.length === 10 && !validateDob(display)) {
                                            showError(t("invalidDate"));
                                            return;
                                        }

                                        const iso = convertToISO(display);

                                        setForm({
                                            ...form,
                                            mukhyaDobDisplay: display,
                                            mukhyaDob: iso,
                                            mukhyaAge: iso ? calculateAge(iso) : ""
                                        });
                                    }}
                                />

                                {/* OR / અથવા TEXT */}
                                <Text fontWeight="bold" color="green.700">
                                    {t("orText")}
                                </Text>

                                {/* AGE INPUT */}
                                <Input
                                    size="lg"
                                    width="120px"
                                    bg="gray.100"
                                    placeholder={t("age")}
                                    value={form.mukhyaAge}
                                    onChange={(e) => {
                                        const value = e.target.value;

                                        if (value && !/^[0-9]{1,3}$/.test(value)) {
                                            showError(t("invalidAge"));
                                            return;
                                        }

                                        setForm({ ...form, mukhyaAge: value });
                                    }}
                                />

                            </HStack>
                        </FormControl>
                        <FormControl>
                            <FormLabel fontWeight="600">{t("aliveDead")}</FormLabel>
                            <Select
                                size="lg"
                                bg="gray.100"
                                value={form.mukhyaIsDeceased ? "dead" : "alive"}
                                onChange={(e) =>
                                    setForm({ ...form, mukhyaIsDeceased: e.target.value === "dead" })
                                }
                            >
                                <option value="alive">{t("alive")}</option>
                                <option value="dead">{t("deceased")}</option>
                            </Select>
                        </FormControl>
                        {/* If mukhya is deceased, show death-date input */}
                        {form.mukhyaIsDeceased && (
                            <FormControl>
                                <FormLabel fontWeight="600">{t("deathDate")}</FormLabel>

                                <Input
                                    type="text"
                                    placeholder="DD/MM/YYYY"
                                    size="lg"
                                    bg="gray.100"
                                    value={form.mukhyaDodDisplay || ""}
                                    onChange={(e) => {
                                        const display = formatDisplayDate(e.target.value);
                                        const iso = convertToISO(display);

                                        setForm({
                                            ...form,
                                            mukhyaDodDisplay: display,
                                            mukhyaDod: iso
                                        });
                                    }}
                                />
                            </FormControl>
                        )}

                        <FormControl>
                            <FormLabel fontWeight="600">{t("totalHeirs")}</FormLabel>

                            <Input
                                type="number"
                                size="lg"
                                bg="gray.100"
                                value={totalHeirs}
                                onChange={(e) => {
                                    let newCount = parseInt(e.target.value || 0);

                                    if (newCount < 0) newCount = 0;

                                    setTotalHeirs(newCount);

                                    if (!isEdit) {
                                        // CREATE MODE → original behaviour
                                        generateHeirs(newCount);
                                        return;
                                    }

                                    // -----------------------------
                                    // EDIT MODE BEHAVIOUR
                                    // -----------------------------
                                    setForm((prev) => {
                                        const updated = { ...prev };
                                        const existing = [...prev.heirs];

                                        if (newCount > existing.length) {
                                            // ADD EMPTY HEIRS
                                            const toAdd = newCount - existing.length;

                                            for (let i = 0; i < toAdd; i++) {
                                                existing.push({
                                                    name: "",
                                                    relation: "",
                                                    age: "",
                                                    dob: "",
                                                    dobDisplay: "",
                                                    mobile: "",
                                                    isDeceased: false,
                                                    dod: "",
                                                    dodDisplay: "",
                                                    showSubFamily: true,
                                                    subFamily: {
                                                        spouse: {
                                                            name: "",
                                                            age: "",
                                                            relation: "",
                                                            // relation2: "",
                                                            dob: "",
                                                            dobDisplay: "",
                                                            isDeceased: false,
                                                            dod: "",
                                                            dodDisplay: ""
                                                        },
                                                        children: []
                                                    }
                                                });
                                            }
                                        } else if (newCount < existing.length) {
                                            // REMOVE EXTRA HEIRS
                                            existing.splice(newCount);
                                        }

                                        updated.heirs = existing;
                                        return updated;
                                    });
                                }}
                                onWheel={(e) => e.target.blur()}
                            />
                        </FormControl>
                        <Button
                            colorScheme="green"
                            size="lg"
                            width="100%"
                            rounded="xl"
                            isDisabled={!form.mukhyaName || !form.mukhyaAge || totalHeirs <= 0}
                            onClick={() => setStep(2)}
                        >
                            {t("next")}
                        </Button>
                    </VStack>

                </Box>
            )}

            {/* STEP 2 */}
            {step === 2 && (
                <Box p={6} bg="white" rounded="2xl" shadow="md" borderWidth="1px">

                    <Heading size="md" mb={4} color="green.700" borderLeft="4px solid #2A7F62" pl={3}>
                        {t("heirs")}
                    </Heading>

                    {form.heirs.map((h, i) => (
                        <Box key={i} p={4} bg="#F8FAF9" rounded="xl" borderWidth="1px" mb={4}>
                            <Text fontWeight="700" mb={2} color="green.800">
                                {t("heirNumber", { number: i + 1 })}
                            </Text>


                            <VStack spacing={3}>

                                <FormControl>
                                    <FormLabel>{t("name")}</FormLabel>
                                    <Input
                                        size="lg"
                                        bg="gray.100"
                                        value={h.name}
                                        onChange={(e) => updateHeir(i, "name", e.target.value)}
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>{t("relation")}</FormLabel>

                                    <Menu placement="bottom">
                                        <MenuButton
                                            as={Button}
                                            size="lg"
                                            bg="gray.100"
                                            rightIcon={<ChevronDownIcon />}
                                            textAlign="left"
                                            width="100%"
                                        >
                                            {h.relation ? t(h.relation) : t("select")}
                                        </MenuButton>

                                        <MenuList maxH="250px" overflowY="auto">
                                            {relationList.map((r) => (
                                                <MenuItem key={r} onClick={() => updateHeir(i, "relation", r)}>
                                                    {t(r)}
                                                </MenuItem>
                                            ))}
                                        </MenuList>
                                    </Menu>
                                </FormControl>
                                <FormControl>
                                    <FormLabel>{t("birthDateAge")}</FormLabel>

                                    <HStack spacing={3} align="center">

                                        {/* DATE */}
                                        <Input
                                            type="text"
                                            placeholder="DD/MM/YYYY"
                                            size="lg"
                                            bg="gray.100"
                                            value={h.dobDisplay || ""}
                                            onChange={(e) => {
                                                const display = formatDisplayDate(e.target.value);

                                                // Validate only when fully entered
                                                if (display.length === 10 && !validateDob(display)) {
                                                    showError(t("invalidDate"));
                                                    return;
                                                }

                                                const iso = convertToISO(display);

                                                const updated = [...form.heirs];
                                                updated[i].dobDisplay = display;
                                                updated[i].dob = iso;
                                                updated[i].age = iso ? calculateAge(iso) : "";

                                                setForm({ ...form, heirs: updated });
                                            }}
                                        />

                                        {/* OR TEXT */}
                                        <Text fontWeight="bold" color="green.700">
                                            {t("orText")}
                                        </Text>

                                        {/* AGE (Manual Entry) */}
                                        <Input
                                            size="lg"
                                            width="120px"
                                            bg="gray.100"
                                            placeholder={t("age")}
                                            value={h.age}
                                            onChange={(e) => {
                                                const value = e.target.value;

                                                if (value && !/^[0-9]{1,3}$/.test(value)) {
                                                    showError(t("invalidAge"));
                                                    return;
                                                }

                                                updateHeir(i, "age", value);
                                            }}
                                        />

                                    </HStack>
                                </FormControl>
                                <FormControl>
                                    <FormLabel>{t("aliveDead")}</FormLabel>

                                    <Select
                                        size="lg"
                                        bg="gray.100"
                                        value={h.isDeceased ? "dead" : "alive"}
                                        onChange={(e) => updateHeir(i, "isDeceased", e.target.value === "dead")}
                                    >
                                        <option value="alive">{t("alive")}</option>
                                        <option value="dead">{t("deceased")}</option>
                                    </Select>
                                    {h.isDeceased && (
                                        <FormControl>
                                            <FormLabel>{t("deathDate")}</FormLabel>

                                            <Input
                                                type="text"
                                                placeholder="DD/MM/YYYY"
                                                size="lg"
                                                bg="gray.100"
                                                value={h.dodDisplay || ""}
                                                onChange={(e) => {
                                                    const display = formatDisplayDate(e.target.value);

                                                    if (display.length === 10 && !validateDob(display)) {
                                                        showError(t("invalidDate"));
                                                        return;
                                                    }

                                                    const iso = convertToISO(display);

                                                    const updated = structuredClone(form.heirs);
                                                    updated[i].dodDisplay = display;
                                                    updated[i].dod = iso;

                                                    setForm({ ...form, heirs: updated });
                                                }}
                                            />
                                        </FormControl>
                                    )}
                                </FormControl>



                                {/* ADD SUB-FAMILY BUTTON */}
                                <Button
                                    size="sm"
                                    colorScheme="green"
                                    variant="outline"
                                    rounded="full"
                                    leftIcon={<ChevronDownIcon />}
                                    onClick={() => {
                                        const u = [...form.heirs];
                                        u[i].showSubFamily = !u[i].showSubFamily;
                                        setForm({ ...form, heirs: u });
                                    }}
                                >
                                    {h.showSubFamily ? t("hideSubFamily") : t("addSubFamily")}
                                </Button>

                                {h.showSubFamily && (
                                    <Box
                                        mt={4}
                                        p={5}
                                        bg="white"
                                        rounded="2xl"
                                        shadow="md"
                                        borderWidth="1px"
                                        borderColor="green.200"
                                    >
                                        {/* Title */}
                                        <Heading size="sm" mb={4} color="green.700">
                                            {h.name
                                                ? t("familyOf", { name: h.name })
                                                : t("familyOfHeir", { number: i + 1 })}
                                        </Heading>

                                        {/* SPOUSE SECTION */}
                                        <Box bg="green.50" p={4} rounded="xl" borderWidth="1px" borderColor="green.100" mb={5}>
                                            <Text fontWeight="600" mb={3} color="green.700">
                                                {t("spouseDetails")}
                                            </Text>

                                            <VStack align="stretch" spacing={3}>
                                                <FormControl>
                                                    <FormLabel>{t("spouseName")}</FormLabel>
                                                    <Input
                                                        size="lg"
                                                        bg="gray.100"
                                                        value={h.subFamily.spouse.name}
                                                        onChange={(e) => {
                                                            const u = [...form.heirs];
                                                            u[i].subFamily.spouse.name = e.target.value;
                                                            setForm({ ...form, heirs: u });
                                                        }}
                                                    />
                                                </FormControl>

                                                <HStack spacing={3}>
                                                    {/* SPOUSE DOB + AGE */}
                                                    <FormControl>
                                                        <FormLabel>{t("spouseBirthDate")}</FormLabel>

                                                        <HStack spacing={3} align="center">

                                                            {/* SPOUSE DOB */}
                                                            <Input
                                                                type="text"
                                                                placeholder="DD/MM/YYYY"
                                                                size="lg"
                                                                bg="gray.100"
                                                                value={h.subFamily.spouse.dobDisplay || ""}
                                                                onChange={(e) => {
                                                                    const display = formatDisplayDate(e.target.value);

                                                                    // Validate full DD/MM/YYYY
                                                                    if (display.length === 10 && !validateDob(display)) {
                                                                        showError(t("invalidDate"));
                                                                        return;
                                                                    }

                                                                    const iso = convertToISO(display);

                                                                    const u = [...form.heirs];
                                                                    u[i].subFamily.spouse.dobDisplay = display;
                                                                    u[i].subFamily.spouse.dob = iso;
                                                                    u[i].subFamily.spouse.age = iso ? calculateAge(iso) : "";

                                                                    setForm({ ...form, heirs: u });
                                                                }}
                                                            />

                                                            {/* OR TEXT */}
                                                            <Text fontWeight="bold" color="green.700">
                                                                {t("orText")}
                                                            </Text>

                                                            {/* SPOUSE AGE */}
                                                            <Input
                                                                size="lg"
                                                                width="120px"
                                                                bg="gray.100"
                                                                placeholder={t("age")}
                                                                value={h.subFamily.spouse.age}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;

                                                                    // Age must be numbers only
                                                                    if (value && !/^[0-9]{1,3}$/.test(value)) {
                                                                        showError(t("invalidAge"));
                                                                        return;
                                                                    }

                                                                    const u = [...form.heirs];
                                                                    u[i].subFamily.spouse.age = value;

                                                                    setForm({ ...form, heirs: u });
                                                                }}
                                                            />

                                                        </HStack>
                                                    </FormControl>
                                                </HStack>

                                                <FormControl>
                                                    <FormLabel>{t("spouseRelation")}</FormLabel>

                                                    <Menu placement="bottom">
                                                        <MenuButton
                                                            as={Button}
                                                            size="lg"
                                                            bg="gray.100"
                                                            rightIcon={<ChevronDownIcon />}
                                                            textAlign="left"
                                                            width="100%"
                                                        >
                                                            {h.subFamily.spouse.relation
                                                                ? t(h.subFamily.spouse.relation)
                                                                : t("select")}
                                                        </MenuButton>

                                                        <MenuList maxH="250px" overflowY="auto">
                                                            {relationList.map((r) => (
                                                                <MenuItem
                                                                    key={r}
                                                                    onClick={() => {
                                                                        const u = JSON.parse(JSON.stringify(form.heirs)); // FIXED
                                                                        u[i].subFamily.spouse.relation = r;
                                                                        setForm({ ...form, heirs: u });
                                                                    }}
                                                                >
                                                                    {t(r)}
                                                                </MenuItem>
                                                            ))}
                                                        </MenuList>
                                                    </Menu>
                                                </FormControl>

                                                <FormControl>
                                                    <FormLabel>{t("spouseAliveDead")}</FormLabel>
                                                    <Select
                                                        size="lg"
                                                        bg="gray.100"
                                                        value={h.subFamily.spouse.isDeceased ? "dead" : "alive"}
                                                        onChange={(e) => {
                                                            const u = [...form.heirs];
                                                            u[i].subFamily.spouse.isDeceased = e.target.value === "dead";
                                                            setForm({ ...form, heirs: u });
                                                        }}
                                                    >
                                                        <option value="alive">{t("alive")}</option>
                                                        <option value="dead">{t("deceased")}</option>
                                                    </Select>
                                                    {h.subFamily.spouse.isDeceased && (
                                                        <FormControl>
                                                            <FormLabel>{t("deathDate")}</FormLabel>

                                                            <Input
                                                                type="text"
                                                                placeholder="DD/MM/YYYY"
                                                                size="lg"
                                                                bg="gray.100"
                                                                value={h.subFamily.spouse.dodDisplay || ""}
                                                                onChange={(e) => {
                                                                    const display = formatDisplayDate(e.target.value);

                                                                    if (display.length === 10 && !validateDob(display)) {
                                                                        showError(t("invalidDate"));
                                                                        return;
                                                                    }

                                                                    const iso = convertToISO(display);

                                                                    const u = structuredClone(form.heirs);
                                                                    u[i].subFamily.spouse.dodDisplay = display;
                                                                    u[i].subFamily.spouse.dod = iso;

                                                                    setForm({ ...form, heirs: u });
                                                                }}
                                                            />
                                                        </FormControl>
                                                    )}
                                                </FormControl>
                                            </VStack>
                                        </Box>

                                        {/* CHILDREN SECTION */}
                                        <Box bg="gray.50" p={4} rounded="xl" borderWidth="1px" borderColor="gray.200">
                                            <Text fontWeight="600" mb={3} color="green.700">
                                                {t("childrenDetails")}
                                            </Text>

                                            {/* TOTAL CHILDREN */}
                                            <FormControl mb={3}>
                                                <FormLabel>{t("totalChildren")}</FormLabel>
                                                <Input
                                                    type="number"
                                                    size="lg"
                                                    bg="gray.100"
                                                    value={h.childCount}
                                                    onChange={(e) => {
                                                        const count = Number(e.target.value);
                                                        const u = [...form.heirs];
                                                        u[i].childCount = count;
                                                        u[i].subFamily.children = Array.from({ length: count }, () => ({
                                                            name: "",
                                                            age: "",
                                                            relation: "",
                                                            isDeceased: false
                                                        }));
                                                        setForm({ ...form, heirs: u });
                                                    }}
                                                    onWheel={(e) => e.target.blur()}

                                                />
                                            </FormControl>

                                            {/* RENDER CHILDREN */}
                                            {h.subFamily.children.map((child, ci) => (
                                                <Box
                                                    key={ci}
                                                    mt={3}
                                                    p={4}
                                                    rounded="lg"
                                                    borderWidth="1px"
                                                    borderColor="gray.300"
                                                    bg="white"
                                                >
                                                    <Text fontWeight="600" mb={2}>
                                                        {t("childNameWithNumber", { number: ci + 1 })}
                                                    </Text>

                                                    <VStack align="stretch" spacing={3}>
                                                        <FormControl>
                                                            <FormLabel>{t("childName")}</FormLabel>
                                                            <Input
                                                                size="lg"
                                                                bg="gray.100"
                                                                value={child.name}
                                                                onChange={(e) => {
                                                                    const u = [...form.heirs];
                                                                    u[i].subFamily.children[ci].name = e.target.value;
                                                                    setForm({ ...form, heirs: u });
                                                                }}
                                                            />
                                                        </FormControl>
                                                        {/* CHILD SPOUSE TOGGLE */}
                                                        <Button
                                                            size="xs"
                                                            colorScheme="green"
                                                            variant="outline"
                                                            rounded="full"
                                                            leftIcon={<ChevronDownIcon />}
                                                            onClick={() => {
                                                                const u = structuredClone(form.heirs);
                                                                u[i].subFamily.children[ci].showSpouse = !child.showSpouse;

                                                                // initialize blank spouse object
                                                                if (!u[i].subFamily.children[ci].spouse) {
                                                                    u[i].subFamily.children[ci].spouse = {
                                                                        name: "",
                                                                        age: "",
                                                                        relation: "",     
                                                                        isDeceased: false
                                                                    };
                                                                }

                                                                setForm({ ...form, heirs: u });
                                                            }}
                                                        >
                                                            {child.showSpouse ? t("hideSpouse") : t("addSpouse")}
                                                        </Button>
                                                        {child.showSpouse && (
                                                            <Box mt={3} p={4} bg="green.50" rounded="xl" borderWidth="1px" borderColor="green.200">
                                                                <Text fontWeight="600" mb={3} color="green.700">
                                                                    {t("childSpouseDetails")}
                                                                </Text>

                                                                <VStack spacing={3} align="stretch">
                                                                    <FormControl>
                                                                        <FormLabel>{t("spouseName")}</FormLabel>
                                                                        <Input
                                                                            size="lg"
                                                                            bg="gray.100"
                                                                            value={child.spouse?.name || ""}
                                                                            onChange={(e) => {
                                                                                const u = structuredClone(form.heirs);
                                                                                u[i].subFamily.children[ci].spouse.name = e.target.value;
                                                                                setForm({ ...form, heirs: u });
                                                                            }}
                                                                        />
                                                                    </FormControl>

                                                                    <HStack spacing={3}>
                                                                        <FormControl>
                                                                            <FormLabel>{t("spouseBirthDate")}</FormLabel>

                                                                            <HStack spacing={3} align="center">

                                                                                {/* SPOUSE DOB */}
                                                                                <Input
                                                                                    type="text"
                                                                                    placeholder="DD/MM/YYYY"
                                                                                    size="lg"
                                                                                    bg="gray.100"
                                                                                    value={child.spouse?.dobDisplay || ""}
                                                                                    onChange={(e) => {
                                                                                        const display = formatDisplayDate(e.target.value);

                                                                                        // validate only when complete
                                                                                        if (display.length === 10 && !validateDob(display)) {
                                                                                            showError(t("invalidDate"));
                                                                                            return;
                                                                                        }

                                                                                        const iso = convertToISO(display);

                                                                                        const u = structuredClone(form.heirs);
                                                                                        u[i].subFamily.children[ci].spouse.dobDisplay = display;
                                                                                        u[i].subFamily.children[ci].spouse.dob = iso;
                                                                                        u[i].subFamily.children[ci].spouse.age = iso ? calculateAge(iso) : "";

                                                                                        setForm({ ...form, heirs: u });
                                                                                    }}
                                                                                />

                                                                                {/* OR TEXT */}
                                                                                <Text fontWeight="bold" color="green.700">
                                                                                    {t("orText")}
                                                                                </Text>

                                                                                {/* SPOUSE AGE */}
                                                                                <FormControl w="150px">
                                                                                    <FormLabel>{t("spouseAge")}</FormLabel>
                                                                                    <Input
                                                                                        size="lg"
                                                                                        bg="gray.100"
                                                                                        value={child.spouse?.age || ""}
                                                                                        placeholder={t("age")}
                                                                                        onChange={(e) => {
                                                                                            const value = e.target.value;

                                                                                            // Age numeric validation
                                                                                            if (value && !/^[0-9]{1,3}$/.test(value)) {
                                                                                                showError(t("invalidAge"));
                                                                                                return;
                                                                                            }

                                                                                            const u = structuredClone(form.heirs);
                                                                                            u[i].subFamily.children[ci].spouse.age = value;
                                                                                            setForm({ ...form, heirs: u });
                                                                                        }}
                                                                                    />
                                                                                </FormControl>

                                                                            </HStack>
                                                                        </FormControl>
                                                                    </HStack>

                                                                    <FormControl>
                                                                        <FormLabel>{t("relation")}</FormLabel>

                                                                        <Menu placement="bottom">
                                                                            <MenuButton
                                                                                as={Button}
                                                                                size="lg"
                                                                                bg="gray.100"
                                                                                rightIcon={<ChevronDownIcon />}
                                                                                textAlign="left"
                                                                                width="100%"
                                                                            >
                                                                                {child.spouse?.relation ? t(child.spouse.relation) : t("select")}
                                                                            </MenuButton>

                                                                            <MenuList maxH="250px" overflowY="auto">
                                                                                {relationList.map((r) => (
                                                                                    <MenuItem
                                                                                        key={r}
                                                                                        onClick={() => {
                                                                                            const u = structuredClone(form.heirs);
                                                                                            u[i].subFamily.children[ci].spouse.relation = r; // ← UPDATED
                                                                                            setForm({ ...form, heirs: u });
                                                                                        }}
                                                                                    >
                                                                                        {t(r)}
                                                                                    </MenuItem>
                                                                                ))}
                                                                            </MenuList>
                                                                        </Menu>
                                                                    </FormControl>



                                                                    <FormControl>
                                                                        <FormLabel>{t("aliveDead")}</FormLabel>
                                                                        <Select
                                                                            size="lg"
                                                                            bg="gray.100"
                                                                            value={child.spouse?.isDeceased ? "dead" : "alive"}
                                                                            onChange={(e) => {
                                                                                const u = structuredClone(form.heirs);
                                                                                u[i].subFamily.children[ci].spouse.isDeceased =
                                                                                    e.target.value === "dead";
                                                                                setForm({ ...form, heirs: u });
                                                                            }}
                                                                        >
                                                                            <option value="alive">{t("alive")}</option>
                                                                            <option value="dead">{t("deceased")}</option>
                                                                        </Select>
                                                                        {child.spouse?.isDeceased && (
                                                                            <FormControl mt={3}>
                                                                                <FormLabel>{t("deathDate")}</FormLabel>

                                                                                <Input
                                                                                    type="text"
                                                                                    placeholder="DD/MM/YYYY"
                                                                                    size="lg"
                                                                                    bg="gray.100"
                                                                                    value={child.spouse?.dodDisplay || ""}
                                                                                    onChange={(e) => {
                                                                                        const display = formatDisplayDate(e.target.value);

                                                                                        // validate death date
                                                                                        if (display.length === 10 && !validateDob(display)) {
                                                                                            showError(t("invalidDate"));
                                                                                            return;
                                                                                        }

                                                                                        const iso = convertToISO(display);

                                                                                        const u = structuredClone(form.heirs);
                                                                                        u[i].subFamily.children[ci].spouse.dodDisplay = display;
                                                                                        u[i].subFamily.children[ci].spouse.dod = iso;

                                                                                        setForm({ ...form, heirs: u });
                                                                                    }}
                                                                                />
                                                                            </FormControl>
                                                                        )}

                                                                        {/* GRANDCHILDREN SECTION */}
                                                                        <Box
                                                                            bg="yellow.50"
                                                                            p={4}
                                                                            rounded="xl"
                                                                            borderWidth="1px"
                                                                            borderColor="yellow.300"
                                                                            mt={4}
                                                                        >
                                                                            <Text fontWeight="600" mb={3} color="yellow.700">
                                                                                {t("grandchildren")} {/* if needed add a key */}
                                                                            </Text>

                                                                            {/* TOTAL GRANDCHILDREN */}
                                                                            <FormControl mb={3}>
                                                                                <FormLabel>{t("totalChildren")}</FormLabel>
                                                                                <Input
                                                                                    type="number"
                                                                                    size="lg"
                                                                                    bg="gray.100"
                                                                                    value={child.grandCount || 0}
                                                                                    onChange={(e) => {
                                                                                        const count = Number(e.target.value);
                                                                                        const u = structuredClone(form.heirs);

                                                                                        u[i].subFamily.children[ci].grandCount = count;

                                                                                        u[i].subFamily.children[ci].children = Array.from(
                                                                                            { length: count },
                                                                                            () => ({
                                                                                                name: "",
                                                                                                relation: "",
                                                                                                age: "",
                                                                                                dob: "",
                                                                                                dobDisplay: "",
                                                                                                isDeceased: false,
                                                                                                spouse: {
                                                                                                    name: "",
                                                                                                    age: "",
                                                                                                    relation: "",
                                                                                                    isDeceased: false
                                                                                                },
                                                                                                children: []
                                                                                            })
                                                                                        );

                                                                                        setForm({ ...form, heirs: u });
                                                                                    }}
                                                                                    onWheel={(e) => e.target.blur()}

                                                                                />
                                                                            </FormControl>

                                                                            {/* RENDER EACH GRANDCHILD */}
                                                                            {child.children?.map((gc, gi) => (
                                                                                <Box
                                                                                    key={gi}
                                                                                    mt={3}
                                                                                    p={4}
                                                                                    rounded="lg"
                                                                                    borderWidth="1px"
                                                                                    borderColor="gray.300"
                                                                                    bg="white"
                                                                                >
                                                                                    <Text fontWeight="600" mb={2}>
                                                                                        {t("childNameWithNumber", { number: gi + 1 })}
                                                                                    </Text>

                                                                                    <VStack spacing={3} align="stretch">

                                                                                        {/* NAME */}
                                                                                        <FormControl>
                                                                                            <FormLabel>{t("name")}</FormLabel>
                                                                                            <Input
                                                                                                size="lg"
                                                                                                bg="gray.100"
                                                                                                value={gc.name}
                                                                                                onChange={(e) => {
                                                                                                    const u = structuredClone(form.heirs);
                                                                                                    u[i].subFamily.children[ci].children[gi].name =
                                                                                                        e.target.value;
                                                                                                    setForm({ ...form, heirs: u });
                                                                                                }}
                                                                                            />
                                                                                        </FormControl>

                                                                                        {/* RELATION DROPDOWN */}
                                                                                        {/* RELATION DROPDOWN */}
                                                                                        <FormControl>
                                                                                            <FormLabel>{t("relation")}</FormLabel>
                                                                                            <Menu>
                                                                                                <MenuButton
                                                                                                    as={Button}
                                                                                                    size="lg"
                                                                                                    bg="gray.100"
                                                                                                    width="100%"
                                                                                                    rightIcon={<ChevronDownIcon />}
                                                                                                    textAlign="left"
                                                                                                >
                                                                                                    {gc.relation ? t(gc.relation) : t("select")}
                                                                                                </MenuButton>

                                                                                                <MenuList maxH="250px" overflowY="auto">
                                                                                                    {relationList.map((r) => (
                                                                                                        <MenuItem
                                                                                                            key={r}
                                                                                                            onClick={() => {
                                                                                                                const u = structuredClone(form.heirs);
                                                                                                                u[i].subFamily.children[ci].children[gi].relation = r;
                                                                                                                setForm({ ...form, heirs: u });
                                                                                                            }}
                                                                                                        >
                                                                                                            {t(r)}
                                                                                                        </MenuItem>
                                                                                                    ))}
                                                                                                </MenuList>
                                                                                            </Menu>
                                                                                        </FormControl>


                                                                                        {/* DOB + AGE */}
                                                                                        <FormControl>
                                                                                            <FormLabel>{t("birthDateAge")}</FormLabel>

                                                                                            <HStack spacing={3} align="center">

                                                                                                {/* GRANDCHILD DOB */}
                                                                                                <Input
                                                                                                    type="text"
                                                                                                    placeholder="DD/MM/YYYY"
                                                                                                    size="lg"
                                                                                                    bg="gray.100"
                                                                                                    value={gc.dobDisplay || ""}
                                                                                                    onChange={(e) => {
                                                                                                        const display = formatDisplayDate(e.target.value);

                                                                                                        // Validate only when full length
                                                                                                        if (display.length === 10 && !validateDob(display)) {
                                                                                                            showError(t("invalidDate"));
                                                                                                            return;
                                                                                                        }

                                                                                                        const iso = convertToISO(display);

                                                                                                        const u = structuredClone(form.heirs);
                                                                                                        u[i].subFamily.children[ci].children[gi].dobDisplay = display;
                                                                                                        u[i].subFamily.children[ci].children[gi].dob = iso;
                                                                                                        u[i].subFamily.children[ci].children[gi].age = iso ? calculateAge(iso) : "";

                                                                                                        setForm({ ...form, heirs: u });
                                                                                                    }}
                                                                                                />

                                                                                                {/* OR TEXT */}
                                                                                                <Text fontWeight="bold" color="green.700">
                                                                                                    {t("orText")}
                                                                                                </Text>

                                                                                                {/* MANUAL AGE INPUT */}
                                                                                                <Input
                                                                                                    size="lg"
                                                                                                    width="120px"
                                                                                                    bg="gray.100"
                                                                                                    placeholder={t("age")}
                                                                                                    value={gc.age}
                                                                                                    onChange={(e) => {
                                                                                                        const value = e.target.value;

                                                                                                        // Age validation (numbers only)
                                                                                                        if (value && !/^[0-9]{1,3}$/.test(value)) {
                                                                                                            showError(t("invalidAge"));
                                                                                                            return;
                                                                                                        }

                                                                                                        const u = structuredClone(form.heirs);
                                                                                                        u[i].subFamily.children[ci].children[gi].age = value;

                                                                                                        setForm({ ...form, heirs: u });
                                                                                                    }}
                                                                                                />

                                                                                            </HStack>
                                                                                        </FormControl>

                                                                                        {/* ALIVE / DEAD */}
                                                                                        <FormControl>
                                                                                            <FormLabel>{t("aliveDead")}</FormLabel>
                                                                                            <Select
                                                                                                size="lg"
                                                                                                bg="gray.100"
                                                                                                value={gc.isDeceased ? "dead" : "alive"}
                                                                                                onChange={(e) => {
                                                                                                    const u = structuredClone(form.heirs);
                                                                                                    u[i].subFamily.children[ci].children[gi].isDeceased =
                                                                                                        e.target.value === "dead";
                                                                                                    setForm({ ...form, heirs: u });
                                                                                                }}
                                                                                            >
                                                                                                <option value="alive">{t("alive")}</option>
                                                                                                <option value="dead">{t("deceased")}</option>
                                                                                            </Select>
                                                                                            {gc.isDeceased && (
                                                                                                <FormControl mt={3}>
                                                                                                    <FormLabel>{t("deathDate")}</FormLabel>

                                                                                                    <Input
                                                                                                        type="text"
                                                                                                        placeholder="DD/MM/YYYY"
                                                                                                        size="lg"
                                                                                                        bg="gray.100"
                                                                                                        value={gc.dodDisplay || ""}
                                                                                                        onChange={(e) => {
                                                                                                            const display = formatDisplayDate(e.target.value);

                                                                                                            // Validate proper date
                                                                                                            if (display.length === 10 && !validateDob(display)) {
                                                                                                                showError(t("invalidDate"));
                                                                                                                return;
                                                                                                            }

                                                                                                            const iso = convertToISO(display);

                                                                                                            const u = structuredClone(form.heirs);
                                                                                                            u[i].subFamily.children[ci].children[gi].dodDisplay = display;
                                                                                                            u[i].subFamily.children[ci].children[gi].dod = iso;

                                                                                                            setForm({ ...form, heirs: u });
                                                                                                        }}
                                                                                                    />
                                                                                                </FormControl>
                                                                                            )}
                                                                                        </FormControl>
                                                                                    </VStack>
                                                                                </Box>
                                                                            ))}
                                                                        </Box>
                                                                    </FormControl>
                                                                </VStack>
                                                            </Box>
                                                        )}

                                                        {/* <FormControl>
                                                            <FormLabel>{t("relation")}</FormLabel>

                                                            <Menu>
                                                                <MenuButton
                                                                    as={Button}
                                                                    size="lg"
                                                                    bg="gray.100"
                                                                    width="100%"
                                                                    rightIcon={<ChevronDownIcon />}
                                                                    textAlign="left"
                                                                >
                                                                    {gc.relation ? t(gc.relation) : t("select")}
                                                                </MenuButton>

                                                                <MenuList maxH="250px" overflowY="auto">
                                                                    {relationList.map((r) => (
                                                                        <MenuItem
                                                                            key={r}
                                                                            onClick={() => {
                                                                                const u = structuredClone(form.heirs);
                                                                                u[i].subFamily.children[ci].children[gi].relation = r;
                                                                                setForm({ ...form, heirs: u });
                                                                            }}
                                                                        >
                                                                            {t(r)}
                                                                        </MenuItem>
                                                                    ))}
                                                                </MenuList>
                                                            </Menu>
                                                        </FormControl> */}
                                                        <FormControl>
                                                            <FormLabel>{t("relation")}</FormLabel>
                                                            <Menu>
                                                                <MenuButton
                                                                    as={Button}
                                                                    size="lg"
                                                                    bg="gray.100"
                                                                    width="100%"
                                                                    rightIcon={<ChevronDownIcon />}
                                                                    textAlign="left"
                                                                >
                                                                    {child.relation ? t(child.relation) : t("select")}
                                                                </MenuButton>

                                                                <MenuList maxH="250px" overflowY="auto">
                                                                    {relationList.map((r) => (
                                                                        <MenuItem
                                                                            key={r}
                                                                            onClick={() => {
                                                                                const u = structuredClone(form.heirs);
                                                                                u[i].subFamily.children[ci].relation = r;
                                                                                setForm({ ...form, heirs: u });
                                                                            }}
                                                                        >
                                                                            {t(r)}
                                                                        </MenuItem>
                                                                    ))}
                                                                </MenuList>
                                                            </Menu>
                                                        </FormControl>
                                                        <HStack spacing={3}>
                                                            <FormControl>
                                                                <FormLabel>{t("birthDateAge")}</FormLabel>

                                                                <HStack spacing={3} align="center">

                                                                    {/* CHILD DOB */}
                                                                    <Input
                                                                        type="text"
                                                                        placeholder="DD/MM/YYYY"
                                                                        size="lg"
                                                                        bg="gray.100"
                                                                        value={child.dobDisplay || ""}
                                                                        onChange={(e) => {
                                                                            const display = formatDisplayDate(e.target.value);

                                                                            // Validate only when full length
                                                                            if (display.length === 10 && !validateDob(display)) {
                                                                                showError(t("invalidDate"));
                                                                                return;
                                                                            }

                                                                            const iso = convertToISO(display);

                                                                            const u = structuredClone(form.heirs);
                                                                            u[i].subFamily.children[ci].dobDisplay = display;
                                                                            u[i].subFamily.children[ci].dob = iso;
                                                                            u[i].subFamily.children[ci].age = iso ? calculateAge(iso) : "";

                                                                            setForm({ ...form, heirs: u });
                                                                        }}
                                                                    />

                                                                    {/* OR TEXT */}
                                                                    <Text fontWeight="bold" color="green.700">
                                                                        {t("orText")}
                                                                    </Text>

                                                                    {/* CHILD AGE */}
                                                                    <Input
                                                                        size="lg"
                                                                        width="120px"
                                                                        bg="gray.100"
                                                                        placeholder={t("age")}
                                                                        value={child.age}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;

                                                                            // AGE VALIDATION
                                                                            if (value && !/^[0-9]{1,3}$/.test(value)) {
                                                                                showError(t("invalidAge"));
                                                                                return;
                                                                            }

                                                                            const u = structuredClone(form.heirs);
                                                                            u[i].subFamily.children[ci].age = value;

                                                                            setForm({ ...form, heirs: u });
                                                                        }}
                                                                    />
                                                                </HStack>
                                                            </FormControl>
                                                        </HStack>

                                                        <FormControl>
                                                            <FormLabel>{t("aliveDead")}</FormLabel>
                                                            <Select
                                                                size="lg"
                                                                bg="gray.100"
                                                                value={child.isDeceased ? "dead" : "alive"}
                                                                onChange={(e) => {
                                                                    const u = structuredClone(form.heirs);
                                                                    u[i].subFamily.children[ci].isDeceased = e.target.value === "dead";
                                                                    setForm({ ...form, heirs: u });
                                                                }}
                                                            >
                                                                <option value="alive">{t("alive")}</option>
                                                                <option value="dead">{t("deceased")}</option>
                                                            </Select>
                                                            {child.isDeceased && (
                                                                <FormControl mt={3}>
                                                                    <FormLabel>{t("deathDate")}</FormLabel>
                                                                    <Input
                                                                        type="text"
                                                                        placeholder="DD/MM/YYYY"
                                                                        size="lg"
                                                                        bg="gray.100"
                                                                        value={child.dodDisplay || ""}
                                                                        onChange={(e) => {
                                                                            const display = formatDisplayDate(e.target.value);

                                                                            // Validate only when full date is typed
                                                                            if (display.length === 10 && !validateDob(display)) {
                                                                                showError(t("invalidDate"));
                                                                                return;
                                                                            }

                                                                            const iso = convertToISO(display);

                                                                            const u = structuredClone(form.heirs);
                                                                            u[i].subFamily.children[ci].dodDisplay = display;
                                                                            u[i].subFamily.children[ci].dod = iso;

                                                                            setForm({ ...form, heirs: u });
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                            )}
                                                        </FormControl>
                                                    </VStack>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                )}


                            </VStack>
                        </Box>
                    ))}

                    <HStack mt={6}>
                        <Button
                            size="lg"
                            variant="outline"
                            colorScheme="green"
                            width="50%"
                            rounded="xl"
                            onClick={() => setStep(1)}
                        >
                            {t("back")}
                        </Button>

                        <Button
                            size="lg"
                            colorScheme="green"
                            width="50%"
                            rounded="xl"
                            onClick={handleSave}
                        >
                            {t("save")}
                        </Button>
                    </HStack>

                </Box>
            )}

        </Box>
    );
}