"use client";

import { useEffect, useState } from "react";
import {
    Box,
    Heading,
    Text,
    Divider,
    Button,
    SimpleGrid,
    VStack,
    HStack,
    Badge,
    Flex
} from "@chakra-ui/react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApiFetch } from "../utils/api";
import PaymentPopup from "../components/PaymentPopup";

export default function RecordView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const apiFetch = useApiFetch();

    const [data, setData] = useState(null);
    const [userStatus, setUserStatus] = useState(null);
    const [showPaymentPopup, setShowPaymentPopup] = useState(false);

    useEffect(() => {
        (async () => {
            const res = await fetch(`http://localhost:5000/api/pedhinamu/${id}`);
            const json = await res.json();
            setData(json);
        })();

        fetchUserStatus();
    }, []);

    const fetchUserStatus = async () => {
        try {
            const { response, data } = await apiFetch("http://localhost:5000/api/register/user/status");
            if (response.ok) {
                setUserStatus(data.user);
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (!data) return <Text p={10}>{t("loading")}</Text>;

    const { pedhinamu, form } = data;

    // Format +91 99999 99999 (Display only)
    const displayMobile = (num) => {
        if (!num) return "-";

        const digits = num.toString().replace(/\D/g, "").slice(0, 10);
        if (!digits) return "-";

        if (digits.length <= 5) return `+91 ${digits}`;

        return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    };
    // Format mobile → +91 99999 99999
    const formatMobile = (num) => {
        if (!num) return "-";
        const digits = num.toString().replace(/\D/g, "").slice(0, 10);
        return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    };

    // Format Aadhaar → 1234 5678 9012
    const formatAadhaar = (num) => {
        if (!num) return "-";
        const digits = num.toString().replace(/\D/g, "").slice(0, 12);
        return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
    };


    // Convert English numbers → Gujarati numbers
    const toGujaratiDigits = (value) => {
        if (!value) return value;
        const map = {
            "0": "૦",
            "1": "૧",
            "2": "૨",
            "3": "૩",
            "4": "૪",
            "5": "૫",
            "6": "૬",
            "7": "૭",
            "8": "૮",
            "9": "૯",
        };
        return value.toString().replace(/[0-9]/g, (d) => map[d]);
    };

    const relationToGujarati = (rel) => {
        if (!rel) return "";

        const map = {
            son: "પુત્ર",
            daughter: "પુત્રી",

            grandson: "પૌત્ર",
            granddaughter: "પૌત્રી",

            great_grandson: "પ્રપૌત્ર",
            great_granddaughter: "પ્રપૌત્રી",

            dohitra: "દોહિત્ર",
            dohitri: "દોહિત્રી",

            wife: "પત્ની",
            husband: "પતિ",

            first_wife: "પ્રથમ પત્ની",
            second_wife: "બીજી પત્ની",
            third_wife: "ત્રીજી પત્ની",
        };

        return map[rel?.toLowerCase()?.trim()] || rel;
    };

    const formatDateToGujarati = (isoDate) => {
        if (!isoDate) return "";
        const date = new Date(isoDate);
        const d = date.getDate();
        const m = date.getMonth() + 1;
        const y = date.getFullYear();
        return `${toGujaratiDigits(d)}/${toGujaratiDigits(m)}/${toGujaratiDigits(y)}`;
    };

    function generateSvgTree(root) {
        const nodeWidth = 180;
        const nodeHeight = 75;
        const hGap = 80;
        const vGap = 130;

        const deceasedSuffix = " (મૈયત)";

        function computeLayout(node, depth = 0, x = 0) {
            node.depth = depth;

            if (!node.children || node.children.length === 0) {
                node.width = nodeWidth;
                node.x = x;
                return nodeWidth;
            }

            let totalWidth = 0;
            node.children.forEach(child => {
                const w = computeLayout(child, depth + 1, x + totalWidth);
                totalWidth += w + hGap;
            });

            totalWidth -= hGap;

            node.width = totalWidth;
            node.x = x + totalWidth / 2 - nodeWidth / 2;

            return totalWidth;
        }

        computeLayout(root);

        function getMaxDepth(node) {
            if (!node.children || node.children.length === 0) return node.depth;
            return Math.max(...node.children.map(getMaxDepth));
        }

        const maxDepth = getMaxDepth(root);
        const totalHeight = (maxDepth + 1) * (nodeHeight + vGap) + 200;
        const totalWidth = root.width + 200;

        let svgNodes = "";
        let svgLines = "";

        function render(node) {
            const xCenter = node.x + nodeWidth / 2;
            const yCenter = node.depth * (nodeHeight + vGap) + 120;

            const isDead = node.isDeceased;
            const textName = isDead ? `${node.name} (મૈયત)` : node.name;
            // const deceasedLine = isDead ? `મૃત્યુ તારીખ: ${toGujaratiDigits(node.dodDisplay)}` : "";


            let relationText = "";

            if (node.relation) {
                relationText = `(${node.relation})`;
            }

            if (!node.isDeceased && !node.isRoot) {
                relationText += `  ઉંમર: ${toGujaratiDigits(node.age || "")}`;
            }


            const bg = isDead ? "#ffe3e3" : "#ffffff";
            const border = isDead ? "#c0392b" : "#000000";

            svgNodes += `
<rect 
    x="${node.x}" 
    y="${yCenter - nodeHeight / 2}"
    width="${nodeWidth}" 
    height="${nodeHeight}"
    rx="10" 
    ry="10"
    fill="${bg}"
    stroke="${border}"
    stroke-width="2"
/>

<text 
    x="${xCenter}" 
    y="${yCenter - 12}"
    text-anchor="middle"
    font-size="18"
    font-weight="700"
    text-decoration="underline"
    font-family="Noto Serif Gujarati"
>${textName}</text>

${isDead ? `
<text 
    x="${xCenter}" 
    y="${yCenter + 8}"
    text-anchor="middle"
    font-size="14"
    font-weight="700"
    fill="#000000"
    font-family="Noto Serif Gujarati"
>તારીખ: ${toGujaratiDigits(node.dodDisplay)}</text>
` : ""}

<text 
    x="${xCenter}" 
    y="${isDead ? (yCenter + 28) : (yCenter + 10)}"
    text-anchor="middle"
    font-size="15"
    font-weight="700"
    fill="#444"
    font-family="Noto Serif Gujarati"
>${relationText}</text>

`;


            if (node.children) {
                node.children.forEach(child => {
                    const childX = child.x + nodeWidth / 2;
                    const childY = (child.depth * (nodeHeight + vGap) + 120) - nodeHeight / 2;

                    svgLines += `
                <line 
                    x1="${xCenter}" 
                    y1="${yCenter + nodeHeight / 2}"
                    x2="${childX}" 
                    y2="${childY}"
                    stroke="#000"
                    stroke-width="2"
                />
            `;

                    render(child);
                });
            }
        }


        render(root);

        return `
        <svg 
            width="100%" 
            height="100%"
            viewBox="0 0 ${totalWidth} ${totalHeight}"
            xmlns="http://www.w3.org/2000/svg"
            style="max-width:100%;height:auto;display:block;margin:auto"
        >
            ${svgLines}
            ${svgNodes}
        </svg>
    `;
    }

  const handlePedhinamuPrint = async () => {
  try {
    // 🔴 FIRST increment & check limit
const res = await apiFetch(
  "http://localhost:5000/api/register/user/increment-print",
  { method: "POST" }
);

if (!res.data.canPrint) {
  setShowPaymentPopup(true);
  return;
}



    // ✅ Only allowed prints reach here
    const response2 = await fetch("/pedhinamu/pedhinamu.html");
    let htmlTemplate = await response2.text();


            const { pedhinamu, form } = data;

            /* -----------------------------------------
               BASIC PLACEHOLDER REPLACEMENTS
            ----------------------------------------- */

            const rawDeathDate =
    pedhinamu?.mukhya?.dodDisplay ||
    pedhinamu?.mukhya?.dod ||
    pedhinamu?.mukhya?.deathDate ||
    pedhinamu?.mukhya?.dateOfDeath ||
    pedhinamu?.mukhya?.death_date ||
    "";
            const replacements = {
                applicantName: form?.applicantName || "",
                mukkamAddress: form?.mukkamAddress || "",
                talatiName: form?.talatiName || "",
                javadNo: form?.javadNo || "",
                totalHeirsCount: form?.totalHeirsCount || "",

                 mukhyoName: pedhinamu?.mukhya?.name || "",

     deathDate:
        pedhinamu?.mukhya?.isDeceased && pedhinamu?.mukhya?.dodDisplay
            ? formatDateToGujarati(pedhinamu.mukhya.dodDisplay)
            : "",
           

                //  REQUIRED FOR સંદર્ભ 
                notarySerialNo: form?.notarySerialNo || "",
                notaryBookNo: form?.notaryBookNo || "",
                notaryPageNo: form?.notaryPageNo || "",
                notaryName: form?.notaryName || "",
                notaryDate: form?.notaryDate
                    ? formatDateToGujarati(form.notaryDate)
                    : "",

                reasonForPedhinamu: form?.reasonForPedhinamu || "",
                jaminSurveyNo: form?.jaminSurveyNo || "",
                jaminKhatano: form?.jaminKhatano || "",

                //  APPLICATION DATE (fallback to createdAt) 
                applicationDate: form?.applicationDate
                    ? formatDateToGujarati(form.applicationDate)
                    : formatDateToGujarati(pedhinamu.createdAt),

                applicantMobile: formatMobile(form?.applicantMobile),
                applicantAadhaar: formatAadhaar(form?.applicantAadhaar),
                applicantPhotoHtml: form?.applicantPhoto 
                    ? `<img src="http://localhost:5000${form.applicantPhoto}" style="width:120px; height:140px; object-fit:cover; border:1px solid #ccc;" />` 
                    : '<div class="placeholder-photo"></div>',

                //  DEFAULT TALUKA / JILLA 
                talukaName: form?.talukaName?.trim()
                    ? form.talukaName
                    : "કાલોલ",

                districtName: form?.districtName?.trim()
                    ? form.districtName
                    : "ગાંધીનગર",
            };

 

            Object.entries(replacements).forEach(([key, value]) => {
                htmlTemplate = htmlTemplate.replace(
                    new RegExp(`{{\\s*${key}\\s*}}`, "g"),
                    toGujaratiDigits(value || "")
                );
            });

            function renderChildrenRecursive(child, padding = 40) {
                let html = `
        <tr>
            <td style="padding-left:${padding}px;">
                • ${child.name}${child.isDeceased ? " (મૈયત)" : ""}
            </td>
            <td>${toGujaratiDigits(child.age || "-")}</td>
            <td>${relationToGujarati(child.relation)}</td>
        </tr>
    `;

                // SPOUSE of CHILD
                if (child.subFamily?.spouse?.name?.trim()) {
                    html += `
            <tr>
                <td style="padding-left:${padding + 20}px;">
                    ➤ ${child.subFamily.spouse.name}${child.subFamily.spouse.isDeceased ? " (મૈયત)" : ""}
                </td>
                <td>${toGujaratiDigits(child.subFamily.spouse.age || "-")}</td>
                <td>${relationToGujarati(child.subFamily.spouse.relation)}</td>
            </tr>
        `;
                }

                // GRANDCHILDREN (children of children)
                if (child.subFamily?.children?.length > 0) {
                    child.subFamily.children.forEach(gc => {
                        html += renderChildrenRecursive(gc, padding + 40);
                    });
                }

                return html;
            }

            /* -----------------------------------------
               HEIRS TABLE (SAFE + CLEAN)
            ----------------------------------------- */

            let heirsHtml = pedhinamu.heirs
                .map((h) => {
                    let spouseRow = "";
                    let childrenRows = "";

                    // spouse
                    if (h.subFamily?.spouse?.name?.trim()) {
                        spouseRow = `
                <tr>
                    <td style="padding-left:25px;">➤ ${h.subFamily.spouse.name}</td>
                    <td>${toGujaratiDigits(h.subFamily.spouse.age || "-")}</td>
                    <td>${relationToGujarati(h.subFamily.spouse.relation)}</td>
                </tr>
            `;
                    }

                    // children
                    // children
                    if (h.subFamily?.children?.length > 0) {
                        childrenRows = h.subFamily.children
                            .map((c) => `
            <tr>
                <td style="padding-left:40px;">• ${c.name}</td>
                <td>${toGujaratiDigits(c.age)}</td>
                <td>${relationToGujarati(c.relation)}</td>
            </tr>
        `)
                            .join("");
                    }


                    return `
            <tr>
                <td><b>${h.name}</b></td>
                <td>${toGujaratiDigits(h.age)}</td>
                <td>${relationToGujarati(h.relation)}</td>
            </tr>
            ${spouseRow}
            ${childrenRows}
        `;
                })
                .join("");

            htmlTemplate = htmlTemplate.replace("{{heirsTable}}", heirsHtml);


            /* -----------------------------------------
               PANCH TABLE
            ----------------------------------------- */
            let panchHtml = form.panch
                .map(
                    (p) => `
                <tr>
                    <td>${p.name}</td>
                    <td>${toGujaratiDigits(p.age)}</td>
                    <td>${p.occupation}</td>
                    <td>${toGujaratiDigits(formatMobile(p.mobile))}</td>
                </tr>`
                )
                .join("");

            htmlTemplate = htmlTemplate.replace("{{panchTable}}", panchHtml);

            /* -----------------------------------------
               PANCH SIGNATURE BLOCKS
            ----------------------------------------- */
            let panchSignHtml = form.panch
                .map(
                    (p) => `
            <p>
                <b>${p.name}</b><br>
                સહી: _______________________<br>
                અંગુઠાનો નિશાન: _____________
            </p>`
                )
                .join("");

            htmlTemplate = htmlTemplate.replace("{{panchSignatureBlocks}}", panchSignHtml);

            /* -----------------------------------------
               PANCH PHOTO BLOCKS
            ----------------------------------------- */
            let panchPhotoHtml = form.panch
                .map(
                    (p) => `
            <table style="margin-bottom: 40px;">
                <tr>
                    <td rowspan="5" style="width:130px;">
                        ${p.photo ? `<img src="http://localhost:5000${p.photo}" style="width:120px; height:120px; object-fit:cover; border:1px solid #ccc;" />` : '<div class="placeholder-photo"></div>'}
                    </td>
                    <td><b>પંચનું નામ :</b> ${p.name}</td>
                </tr>
                <tr><td><b>આધાર નંબર :</b> ${toGujaratiDigits(formatAadhaar(p.aadhaar))}</td></tr>
                <tr><td><b>અંગુઠાનુ નિશાન :</b> __________________</td></tr>
                <tr><td><b>સહી :</b> _____________________________</td></tr>
                <tr><td><b>મો. નંબર :</b> ${toGujaratiDigits(formatMobile(p.mobile))}</td></tr>
            </table>
        `
                )
                .join("");


            htmlTemplate = htmlTemplate.replace("{{panchPhotoBlocks}}", panchPhotoHtml);

            /* -----------------------------------------
                FAMILY TREE BUILDER (Dynamic)
                ----------------------------------------- */

            function buildNode(person) {
                if (!person) return null;

                // Build this node
                const node = {
                    name: person.name,
                    age: person.age || "",
                    dodDisplay: person.dodDisplay || "",
                    relation: relationToGujarati(person.relation),
                    isDeceased: person.isDeceased || false,
                    isRoot: person.isRoot || false,
                    children: []
                };

                /* --------------------------------------
                   1️⃣ ADD SPOUSE (works for ALL levels)
                -------------------------------------- */
                const spouse =
                    person.spouse ||          // child.spouse OR grandchild spouse
                    person.subFamily?.spouse; // heir spouse

                if (spouse?.name?.trim()) {
                    node.children.push({
                        name: spouse.name,
                        age: spouse.age || "",
                        relation: relationToGujarati(spouse.relation),
                        isDeceased: spouse.isDeceased || false,
                        children: []
                    });
                }

                /* --------------------------------------
                   2️⃣ ADD CHILDREN (correct handling)
                -------------------------------------- */
                const personChildren =
                    person.subFamily?.children ||   // heirs → children
                    person.children ||              // children → grandchildren
                    [];

                personChildren.forEach(c => {
                    node.children.push(buildNode(c));
                });

                return node;
            }

            const rootPerson = buildNode({
                ...pedhinamu.mukhya,
                relation: "",
                isRoot: true,
                spouse: pedhinamu.mukhya.spouse || null,  // if stored
                children: pedhinamu.heirs                 // main heirs become children of root
            });




            const renderTree = (nodes, isRoot = false) => {
                if (!nodes || nodes.length === 0) return "";

                let html = "<ul>";

                nodes.forEach((node) => {
                    const deceasedClass = node.isDeceased ? "node-deceased" : "";

                    html += `
<li>
    <div class="node-box ${isRoot ? "tree-root" : ""} ${deceasedClass}">
        <b>${node.name}</b><br>
        <span>${node.relation}</span>
    </div>
`;

                    if (node.children?.length) {
                        html += renderTree(node.children, false);
                    }

                    html += `</li>`;
                });

                html += "</ul>";
                return html;
            };

            const svgTree = generateSvgTree(rootPerson);

            htmlTemplate = htmlTemplate.replace(/{{\s*familyTreeHtml\s*}}/g, svgTree);


            /* -----------------------------------------
               PRINT WINDOW
            ----------------------------------------- */
             const printWindow = window.open("", "_blank", "width=1000,height=1200");
    printWindow.document.write(htmlTemplate);
    await printWindow.document.fonts.ready;
    printWindow.document.close();

  } catch (err) {
    console.error("PRINT ERROR:", err);
  }
};
    return (
        <Box bg="#F8FAF9" minH="100vh" p={10}>
            <Flex justify="space-between" mb={5}>
                <Button
                    colorScheme="green"
                    onClick={() => navigate("/records")}
                    px={6}
                >
                    ← {t("back")}
                </Button>

                <Button
                    colorScheme="green"
                    px={6}
                    onClick={handlePedhinamuPrint}
                >
                    {t("printPedhinamu")}
                </Button>
            </Flex>

            <Box
                bg="white"
                p={8}
                rounded="2xl"
                shadow="md"
                border="1px solid #E3EDE8"
            >
                <Heading size="lg" mb={4} color="#1E4D2B">
                    {t("certificateDetails")}
                </Heading>

                {/* ---------------------- BASIC DETAILS ---------------------- */}
                <Heading size="md" mt={6}>{t("basicDetails")}</Heading>
                <Divider my={3} />

                <SimpleGrid columns={[1, 2]} spacing={5} mt={2}>
                    <Box>
                        <Text fontWeight="600">{t("mukhyoName")}:</Text>

                        <HStack>
                            <Text
                                fontWeight="700"
                                color={pedhinamu.mukhya.isDeceased ? "red.600" : "black"}
                                textDecoration={pedhinamu.mukhya.isDeceased ? "line-through" : "none"}
                            >
                                {pedhinamu.mukhya.name}
                            </Text>

                            {pedhinamu.mukhya.isDeceased && (
                                <Badge colorScheme="red">{t("isDeceasedShort")}</Badge>
                            )}
                        </HStack>
                    </Box>

                    <Box>
                        <Text fontWeight="600">{t("age")}:</Text>
                        <Text>{pedhinamu.mukhya?.age}</Text>
                    </Box>

                    {pedhinamu.mukhya.isDeceased && (
                        <Box>
                            <Text fontWeight="600">મૃત્યુ તારીખ:</Text>
                            <Text>{pedhinamu.mukhya.dodDisplay || "-"}</Text>
                        </Box>
                    )}
                </SimpleGrid>


                {/* ---------------------- HEIRS ---------------------- */}
                <Heading size="md" mt={8}>{t("heirInfo")}</Heading>
                <Divider my={3} />

                <SimpleGrid columns={[1, 2]} spacing={6}>
                    {pedhinamu.heirs.map((h, i) => (
                        <Box
                            key={i}
                            p={4}
                            borderWidth="1px"
                            rounded="lg"
                            shadow="sm"
                            bg={h.isDeceased ? "#F9EAEA" : "#FAFFFA"}
                            borderColor={h.isDeceased ? "red.400" : "gray.200"}
                        >
                            {/* MAIN HEIR */}
                            <HStack justify="space-between">
                                <Text
                                    fontSize="lg"
                                    fontWeight="600"
                                    textDecoration={h.isDeceased ? "line-through" : "none"}
                                    color={h.isDeceased ? "red.600" : "black"}
                                >
                                    {h.name} {h.isDeceased && t("isDeceasedShort")}
                                </Text>

                                <Badge
                                    colorScheme={h.isDeceased ? "red" : "green"}
                                    px={3}
                                >
                                    {t(h.relation)}
                                </Badge>
                            </HStack>

                            <Divider my={2} />

                            <Text><b>{t("age")}:</b> {h.age}</Text>
                            {h.isDeceased && (
                                <HStack>
                                    <Text fontWeight="600" color="black">મૃત્યુ તારીખ:</Text>
                                    <Text fontWeight="600" color="red.600">{h.dodDisplay || "-"}</Text>
                                </HStack>
                            )}


                            {/* SPOUSE */}
                            {h.subFamily?.spouse?.name?.trim() && (
                                <Box
                                    mt={4}
                                    p={3}
                                    bg="#fff"
                                    borderWidth="1px"
                                    rounded="md"
                                    borderColor={h.subFamily.spouse.isDeceased ? "red.400" : "gray.300"}
                                >
                                    <Text
                                        fontWeight="600"
                                        color={h.subFamily.spouse.isDeceased ? "red.600" : "green.600"}
                                        textDecoration={h.subFamily.spouse.isDeceased ? "line-through" : "none"}
                                    >
                                        {t("spouse")} {h.subFamily.spouse.isDeceased && t("isDeceasedShort")}
                                    </Text>

                                    <Divider my={2} />

                                    <Text><b>{t("name")}:</b> {h.subFamily.spouse.name}</Text>
                                    <Text><b>{t("age")}:</b> {h.subFamily.spouse.age || "-"}</Text>
                                    {h.subFamily.spouse.isDeceased && (
                                        <Text color="red.600" fontWeight="600">
                                            {t("isDeceasedShort")} • {h.subFamily.spouse.dodDisplay || "-"}
                                        </Text>
                                    )}

                                    <Text><b>{t("relation")}:</b> {t(h.subFamily.spouse.relation)}</Text>
                                </Box>
                            )}

                            {/* CHILDREN */}
                            {h.subFamily?.children?.length > 0 && (
                                <Box
                                    mt={4}
                                    p={3}
                                    bg="#fff"
                                    borderWidth="1px"
                                    rounded="md"
                                >
                                    <Text fontWeight="600" color="blue.600">{t("children")}</Text>
                                    <Divider my={2} />

                                    {h.subFamily.children.map((c, index) => (
                                        <Box
                                            key={index}
                                            mb={2}
                                            p={2}
                                            borderWidth="1px"
                                            rounded="md"
                                            borderColor={c.isDeceased ? "red.400" : "gray.200"}
                                            bg={c.isDeceased ? "#F9EAEA" : "white"}
                                        >
                                            <Text
                                                fontWeight="600"
                                                textDecoration={c.isDeceased ? "line-through" : "none"}
                                                color={c.isDeceased ? "red.600" : "black"}
                                            >
                                                {c.name} {c.isDeceased && t("isDeceasedShort")}
                                            </Text>

                                            <Text><b>{t("age")}:</b> {c.age}</Text>
                                            <Text><b>{t("relation")}:</b> {t(c.relation)}</Text>
                                        </Box>
                                    ))}
                                </Box>
                            )}

                        </Box>
                    ))}
                </SimpleGrid>
                {/* ---------------------- FULL FORM ---------------------- */}
                {form ? (
                    <>
                        {/* TALATI */}
                        <Heading size="md" mt={8}>{t("talatiNote")}</Heading>
                        <Divider my={3} />

                        <SimpleGrid columns={[1, 2]} spacing={5}>
                            <Box>
                                <Text fontWeight="600">{t("talatiName")}:</Text>
                                <Text>{form.talatiName}</Text>
                            </Box>

                            <Box>
                                <Text fontWeight="600">{t("javadNo")}:</Text>
                                <Text>{form.javadNo}</Text>
                            </Box>

                            <Box>
                                <Text fontWeight="600">{t("totalHeirsCount")}:</Text>
                                <Text>{form.totalHeirsCount}</Text>
                            </Box>
                        </SimpleGrid>

                        {/* PANCH */}
                        <Heading size="md" mt={8}>{t("panchInfo")}</Heading>
                        <Divider my={3} />

                        <SimpleGrid columns={[1, 2]} spacing={6}>
                            {form.panch.map((p, i) => (
                                <Box
                                    key={i}
                                    p={4}
                                    borderWidth="1px"
                                    rounded="lg"
                                    shadow="sm"
                                    bg="#FFFDF5"
                                >
                                    <HStack spacing={4} align="start">
                                        {p.photo && (
                                            <Box>
                                                <img 
                                                    src={`http://localhost:5000${p.photo}`} 
                                                    alt={`Panch ${p.name}`}
                                                    style={{ 
                                                        width: '80px', 
                                                        height: '80px', 
                                                        objectFit: 'cover', 
                                                        borderRadius: '8px',
                                                        border: '1px solid #ccc'
                                                    }} 
                                                />
                                            </Box>
                                        )}
                                        <Box flex="1">
                                            <Text fontSize="lg" fontWeight="600">{p.name}</Text>
                                            <Divider my={2} />
                                            <Text><b>{t("age")}:</b> {p.age}</Text>
                                            <Text><b>{t("mobile")}:</b> {displayMobile(p.mobile)}</Text>
                                            <Text><b>{t("occupation")}:</b> {p.occupation || "-"}</Text>
                                        </Box>
                                    </HStack>
                                </Box>
                            ))}
                        </SimpleGrid>
                    </>
                ) : (
                    <Text color="red.500" mt={5}>
                        {t("notFilled")}
                    </Text>
                )}
            </Box>

            <PaymentPopup
                isOpen={showPaymentPopup}
                onClose={() => setShowPaymentPopup(false)}
                type="print"
            />
        </Box>
    );
    }