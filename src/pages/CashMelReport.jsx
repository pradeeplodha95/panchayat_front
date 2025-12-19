import React, { useState } from "react";
import {
    Box,
    HStack,
    Select,
    Button,
    useToast,
    Icon,
} from "@chakra-ui/react";
import { FiPrinter } from "react-icons/fi";

// DateInput component (simplified for this artifact)
const DateInput = ({ label, name, value, onDateChange, formatDisplayDate, convertToISO }) => {
    return (
        <Box>
            <label style={{ fontSize: '14px', fontWeight: 600 }}>{label}</label>
            <input
                type="text"
                placeholder="DD/MM/YYYY"
                value={value}
                onChange={(e) => {
                    const display = formatDisplayDate(e.target.value);
                    const iso = convertToISO(display);
                    onDateChange(name, display);
                }}
                style={{
                    width: '150px',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    marginTop: '4px'
                }}
            />
        </Box>
    );
};

const CashMelReport = ({ apiBase, customCategories, banks }) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState({ from: "", to: "", type: "aavak" });

    const handleReportChange = (key, value) => {
        setReport((p) => ({ ...p, [key]: value }));
    };

    const guj = (num) => {
        if (num === null || num === undefined || num === "") return "";
        const gujaratiDigits = ["૦", "૧", "૨", "૩", "૪", "૫", "૬", "૭", "૮", "૯"];
        return String(num).replace(/\d/g, (d) => gujaratiDigits[parseInt(d)]);
    };

    const formatDateToGujarati = (display) => {
        if (!display) return "";
        return display.replace(/\d/g, (d) => guj(d));
    };

    const getGujaratiFinancialYear = (dateRange) => {
        const year = Number(dateRange.substring(0, 4));
        const fyStart = year - 1;
        const fyEnd = year;
        return `${guj(fyStart)}–${guj(fyEnd)}`;
    };

    const formatDisplayDate = (input) => {
        const digits = input.replace(/\D/g, "").slice(0, 8);
        if (digits.length <= 2) return digits;
        if (digits.length <= 4) return digits.slice(0, 2) + "/" + digits.slice(2);
        return digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
    };

    const convertToISO = (display) => {
        const [d, m, y] = display.split("/");
        if (!d || !m || !y || y.length !== 4) return "";
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    };

const handlePrintReport = async () => {
    if (!report.from || !report.to) {
        toast({
            title: "તારીખ પસંદ કરો",
            status: "error",
            duration: 2000,
            position: "top",
        });
        return;
    }

    setLoading(true);

    try {
        let templateFile = "/aavak/aavak.html";
        if (report.type === "javak") templateFile = "/javak/javak.html";
        else if (report.type === "tarij") templateFile = "/tarij/tarij.html";
        else if (report.type === "checkIssue") templateFile = "/check-details/check-details.html";
        else if (report.type === "rojmel") templateFile = "/rojmel/rojmel.html";

        const fromDate = convertToISO(report.from);
        const toDate = convertToISO(report.to);

        // ======================================================
        // ✅ CHECK ISSUE REPORT
        // ======================================================
        if (report.type === "checkIssue") {
            const qs = `?from=${fromDate}&to=${toDate}`;
            const url = `${apiBase}/cashmel/report${qs}`;
            const recordsRes = await fetch(url);
            const resJson = await recordsRes.json();
            const allRecords = Array.isArray(resJson.rows) ? resJson.rows : [];

            const checkedRows = allRecords.filter(r =>
                r.vyavharType === "javak" &&
                r.paymentMethod === "bank"
            );

            if (checkedRows.length === 0) {
                toast({
                    title: "બેંક ચેક રેકોર્ડ નથી",
                    status: "warning",
                });
                setLoading(false);
                return;
            }

            let rowsHtml = "";
            checkedRows.forEach((r, i) => {
                rowsHtml += `
<tr>
    <td>${guj(i + 1)}</td>
    <td>${formatDateToGujarati(r.date?.slice(0, 10))}</td>
    <td>${r.ddCheckNum || ""}</td>
    <td class="text-right">${guj(r.amount || 0)}</td>
    <td>${r.receiptPaymentNo || ""}</td>
    <td>${r.name || ""}</td>
    <td>${r.remarks || ""}</td>
</tr>`;
            });

            const templateRes = await fetch(templateFile);
            if (!templateRes.ok) throw new Error("Template missing");

            let htmlTemplate = await templateRes.text();
            const fyGujarati = getGujaratiFinancialYear(fromDate);

            htmlTemplate = htmlTemplate
                .replace("{{yearRange}}", fyGujarati)
                .replace(
                    "{{dateRange}}",
                    `${formatDateToGujarati(report.from)} થી ${formatDateToGujarati(report.to)}`
                )
                .replace("{{rows}}", rowsHtml);

            const win = window.open("", "_blank", "width=900,height=700");
            win.document.write(htmlTemplate);
            win.document.close();
            setTimeout(() => win.print(), 500);

            setLoading(false);
            return;
        }

        // ======================================================
        // ===================== ROJMEL =========================
        // ======================================================
        if (report.type === "rojmel") {
            const qs = `?from=${fromDate}&to=${toDate}`;
            const url = `${apiBase}/cashmel/report${qs}`;
            const recordsRes = await fetch(url);
            const resJson = await recordsRes.json();
            const allRecords = Array.isArray(resJson.rows) ? resJson.rows : [];

            if (allRecords.length === 0) {
                toast({
                    title: "કોઈ રેકોર્ડ નથી",
                    status: "warning",
                    duration: 2000,
                });
                setLoading(false);
                return;
            }

            /* ================= OPENING BALANCE ================= */
            let openingBalance = 0;
            try {
                const year = Number(fromDate.substring(0, 4));
                const month = Number(fromDate.substring(5, 7));
                const fyStartYear = month < 4 ? year - 1 : year;

                const prevFrom = `${fyStartYear}-04-01`;
                const prevToDate = new Date(fromDate);
                prevToDate.setDate(prevToDate.getDate() - 1);
                const prevTo = prevToDate.toISOString().slice(0, 10);

                if (prevTo >= prevFrom) {
                    const prevQs = `?from=${prevFrom}&to=${prevTo}`;
                    const prevRes = await fetch(`${apiBase}/cashmel/report${prevQs}`);
                    const prevJson = await prevRes.json();

                    const prevRecords = Array.isArray(prevJson.rows) ? prevJson.rows : [];

                    let prevAavak = 0;
                    let prevJavak = 0;

                    prevRecords.forEach(r => {
                        if (r.vyavharType === "aavak") prevAavak += r.amount || 0;
                        else prevJavak += r.amount || 0;
                    });

                    openingBalance = prevAavak - prevJavak;
                }
            } catch (err) {
                console.error("Error calculating opening balance:", err);
            }

            /* ================= AAVAK CATEGORIES ================= */
            const allAavakCategories = (customCategories?.aavak || [])
                .filter(cat => !cat.isDeleted)
                .map(cat => cat.name);

            if (allAavakCategories.length === 0) {
                const fallbackSet = new Set();
                allRecords.forEach(r => {
                    if (r.vyavharType === "aavak" && r.category) {
                        fallbackSet.add(r.category);
                    }
                });
                allAavakCategories.push(...Array.from(fallbackSet));
            }

            const incomeColspan = allAavakCategories.length + 1;
            const totalIncomeCols = incomeColspan;

            const incomeHeadersHTML = allAavakCategories.map(cat => `<th>${cat}</th>`).join("");

            /* ================= DATE MAP ================= */
            const dateMap = {};
            allRecords.forEach(r => {
                const d = r.date.slice(0, 10);
                if (!dateMap[d]) dateMap[d] = { aavak: [], javak: [] };

                if (r.vyavharType === "aavak") dateMap[d].aavak.push(r);
                else dateMap[d].javak.push(r);
            });

            /* ================= TOTALS ================= */
            let totalAavakAmount = openingBalance;
            let totalJavakAmount = 0;

            const categoryTotals = {};
            allAavakCategories.forEach(cat => categoryTotals[cat] = 0);

            const sortedDates = Object.keys(dateMap).sort();
            let tableRows = "";

            /* ================= DAILY ROWS ================= */
            sortedDates.forEach(dateKey => {
                const day = dateMap[dateKey];
                const maxRows = Math.max(day.aavak.length + 1, day.javak.length);

                for (let i = 0; i < maxRows; i++) {
                    let a = null;
                    if (i === 0) {
                        a = { name: "ઉઘડતી સિલક", amount: openingBalance };
                    } else {
                        a = day.aavak[i - 1];
                    }

                    const j = day.javak[i];

                    let categoryCells = "";

                    if (a && a.name !== "ઉઘડતી સિલક") {
                        categoryCells = allAavakCategories.map(cat => {
                            if (a.category === cat) {
                                categoryTotals[cat] += a.amount;
                                totalAavakAmount += a.amount;
                                return `<td class="text-right">${guj(a.amount)}</td>`;
                            }
                            return `<td class="text-right">૦</td>`;
                        }).join("");
                    } else {
                        categoryCells = allAavakCategories
                            .map(() => `<td class="text-right">૦</td>`)
                            .join("");
                    }

                    if (j) totalJavakAmount += j.amount;

                    tableRows += `
<tr>
    <td>${a?.receiptPaymentNo ? guj(a.receiptPaymentNo) : ""}</td>
    <td>${a?.name || ""}</td>
    ${categoryCells}
    <td class="text-right">${a ? guj(a.amount || 0) : ""}</td>

    <td>${j?.ddCheckNum ? guj(j.ddCheckNum) : ""}</td>
    <td>${j?.receiptPaymentNo ? guj(j.receiptPaymentNo) : ""}</td>
    <td>${j?.name || ""}</td>
    <td>${j?.remarks || ""}</td>
    <td>${j?.category || ""}</td>
    <td class="text-right">${j ? guj(j.amount || 0) : ""}</td>
</tr>`;
                }
            });

            /* ================= TOTAL ROW ================= */
            const totalCategoryCells = allAavakCategories.map(cat =>
                `<td class="text-right"><b>${guj(categoryTotals[cat])}</b></td>`
            ).join("");

            tableRows += `
<tr style="font-weight:bold;">
    <td></td>
    <td>કુલ આવક</td>
    ${totalCategoryCells}
    <td class="text-right">${guj(totalAavakAmount)}</td>
    <td colspan="5"></td>
    <td class="text-right">${guj(totalJavakAmount)}</td>
</tr>`;

            const bandhSilak = totalAavakAmount - totalJavakAmount;

            tableRows += `
<tr>
<td colspan="100%" style="font-weight:bold;text-align:right;">
    કુલ આવક : ${guj(totalAavakAmount)}<br/>
    કુલ જાવક : ${guj(totalJavakAmount)}<br/>
    બંધ સિલક : ${guj(bandhSilak)}
</td>
</tr>`;

            /* ================= ACCOUNT TRANSFER TABLE ================= */
            const uniqueBanks = new Set();
            allRecords.forEach(r => {
                if (r.paymentMethod === "bank" && r.bank) {
                    uniqueBanks.add(r.bank);
                }
            });

            async function getAccountBalanceBefore(accountType, accountName, date) {
                const year = Number(date.substring(0, 4));
                const month = Number(date.substring(5, 7));
                const fyStartYear = month < 4 ? year - 1 : year;
                const fyStart = `${fyStartYear}-04-01`;

                const prevToDate = new Date(date);
                prevToDate.setDate(prevToDate.getDate() - 1);
                const prevTo = prevToDate.toISOString().slice(0, 10);

                if (prevTo < fyStart) return 0;

                const prevQs = `?from=${fyStart}&to=${prevTo}`;
                const prevRes = await fetch(`${apiBase}/cashmel/report${prevQs}`);
                const prevJson = await prevRes.json();
                const records = Array.isArray(prevJson.rows) ? prevJson.rows : [];

                let total = 0;
                records.forEach(r => {
                    const match = 
                        (accountType === "cash" && r.paymentMethod !== "bank") ||
                        (accountType === "bank" && r.paymentMethod === "bank" && r.bank === accountName);

                    if (match) {
                        if (r.vyavharType === "aavak") total += r.amount || 0;
                        else total -= r.amount || 0;
                    }
                });
                return total;
            }

            function getPeriodAccountFlow(accountType, accountName) {
                let income = 0, expense = 0;
                allRecords.forEach(r => {
                    const match = 
                        (accountType === "cash" && r.paymentMethod !== "bank") ||
                        (accountType === "bank" && r.paymentMethod === "bank" && r.bank === accountName);

                    if (match) {
                        if (r.vyavharType === "aavak") income += r.amount || 0;
                        else expense += r.amount || 0;
                    }
                });
                return { income, expense };
            }

            let accountTransferRows = "";
            let srNo = 1;

            const cashOpening = await getAccountBalanceBefore("cash", null, fromDate);
            const { income: cashIncome, expense: cashExpense } = getPeriodAccountFlow("cash", null);
            const cashClosing = cashOpening + cashIncome - cashExpense;

            accountTransferRows += `
<tr>
    <td>${guj(srNo++)}</td>
    <td>રોકડ</td>
    <td class="text-right">${guj(cashOpening)}</td>
    <td class="text-right">${guj(cashIncome)}</td>
    <td class="text-right">${guj(cashExpense)}</td>
    <td class="text-right">${guj(cashClosing)}</td>
</tr>`;

            for (const bankName of uniqueBanks) {
                const bankOpening = await getAccountBalanceBefore("bank", bankName, fromDate);
                const { income: bankIncome, expense: bankExpense } = getPeriodAccountFlow("bank", bankName);
                const bankClosing = bankOpening + bankIncome - bankExpense;

                accountTransferRows += `
<tr>
    <td>${guj(srNo++)}</td>
    <td>${bankName}</td>
    <td class="text-right">${guj(bankOpening)}</td>
    <td class="text-right">${guj(bankIncome)}</td>
    <td class="text-right">${guj(bankExpense)}</td>
    <td class="text-right">${guj(bankClosing)}</td>
</tr>`;
            }

            /* ================= PRINT ================= */
            const templateRes = await fetch(templateFile);
            let htmlTemplate = await templateRes.text();

            const fyGujarati = getGujaratiFinancialYear(fromDate);

            htmlTemplate = htmlTemplate
                .replace("{{yearRange}}", fyGujarati)
                .replace(
                    "{{dateRange}}",
                    `${formatDateToGujarati(report.from)} થી ${formatDateToGujarati(report.to)}`
                )
                .replace("{{incomeHeaders}}", incomeHeadersHTML)
                .replace("{{tableRows}}", tableRows)
                .replace("{{totalIncomeCols}}", totalIncomeCols)
                .replace("{{incomeColspan}}", incomeColspan)
                .replace("{{accountTransferRows}}", accountTransferRows);

            const win = window.open("", "_blank", "width=1200,height=800");
            win.document.write(htmlTemplate);
            win.document.close();
            setTimeout(() => win.print(), 500);

            setLoading(false);
            return;
        }

        // ======================================================
        // ======= AAVAK / JAVAK / TARIJ REPORTS ===============
        // ======================================================
        const templateRes = await fetch(templateFile);
        if (!templateRes.ok) throw new Error("Template missing");
        let htmlTemplate = await templateRes.text();

        const fromDateObj = new Date(fromDate);

        // Fetch data from beginning of the year for accurate carry-forward
        const yearStart = new Date(fromDateObj.getFullYear(), 0, 1);
        const historicalFromDate = yearStart.toISOString().slice(0, 10);

        const historicalQs = `?vyavharType=${report.type}&from=${historicalFromDate}&to=${toDate}`;
        const historicalUrl = `${apiBase}/cashmel/report${historicalQs}`;
        const recordsRes = await fetch(historicalUrl);
        const resJson = await recordsRes.json();
        const allRecords = Array.isArray(resJson.rows) ? resJson.rows : [];

        if (allRecords.length === 0) {
            toast({ title: "કોઈ રેકોર્ડ નથી", status: "warning", duration: 2000 });
            setLoading(false);
            return;
        }

        // ================================
        // TARIJ REPORT (તરીજ પત્રક)
        // ================================
        if (report.type === "tarij") {
            const selectedRecords = allRecords.filter(r => {
                const d = new Date(r.date);
                return d >= new Date(fromDate) && d <= new Date(toDate);
            });

            const aavakRecords = selectedRecords.filter(r => r.vyavharType === "aavak");
            const javakRecords = selectedRecords.filter(r => r.vyavharType === "javak");

            const aavakMap = {};
            const javakMap = {};

            aavakRecords.forEach(rec => {
                const cat = customCategories?.[rec.category] || rec.category;
                aavakMap[cat] = (aavakMap[cat] || 0) + Number(rec.amount || 0);
            });
            javakRecords.forEach(rec => {
                const cat = customCategories?.[rec.category] || rec.category;
                javakMap[cat] = (javakMap[cat] || 0) + Number(rec.amount || 0);
            });

            const aCats = Object.keys(aavakMap).sort();
            const jCats = Object.keys(javakMap).sort();
            const max = Math.max(aCats.length, jCats.length);

            let tableRows = "";
            let totalA = 0;
            let totalJ = 0;

            for (let i = 0; i < max; i++) {
                const ac = aCats[i] || "";
                const ja = jCats[i] || "";
                const aAmt = aavakMap[ac] || 0;
                const jAmt = javakMap[ja] || 0;
                totalA += aAmt;
                totalJ += jAmt;

                tableRows += `
                <tr>
                    <td>${ac ? i + 1 : ""}</td>
                    <td>${ac}</td>
                    <td class="text-right">${guj(aAmt) || ""}</td>
                    <td>${ja ? i + 1 : ""}</td>
                    <td>${ja}</td>
                    <td class="text-right">${guj(jAmt) || ""}</td>
                </tr>`;
            }

            // Opening Balance Calculation (Previous Year)
            let openingBalance = 0;
            try {
                const prevFrom = new Date(fromDate);
                prevFrom.setFullYear(prevFrom.getFullYear() - 1);
                const prevTo = new Date(toDate);
                prevTo.setFullYear(prevTo.getFullYear() - 1);

                const prevQs = `?from=${prevFrom.toISOString().slice(0,10)}&to=${prevTo.toISOString().slice(0,10)}`;
                const prevRes = await fetch(`${apiBase}/cashmel/report${prevQs}`);
                const prevJson = await prevRes.json();
                const prevRows = Array.isArray(prevJson.rows) ? prevJson.rows : [];

                let prevAavak = 0, prevJavak = 0;
                prevRows.forEach(r => {
                    const amt = Number(r.amount || 0);
                    if (r.vyavharType === "aavak") prevAavak += amt;
                    if (r.vyavharType === "javak") prevJavak += amt;
                });

                // Previous year's opening balance
                const prevPrevFrom = new Date(prevFrom);
                prevPrevFrom.setFullYear(prevPrevFrom.getFullYear() - 1);
                const prevPrevTo = new Date(prevTo);
                prevPrevTo.setFullYear(prevPrevTo.getFullYear() - 1);

                const prevPrevRes = await fetch(`${apiBase}/cashmel/report?from=${prevPrevFrom.toISOString().slice(0,10)}&to=${prevPrevTo.toISOString().slice(0,10)}`);
                const prevPrevJson = await prevPrevRes.json();
                const prevPrevRows = Array.isArray(prevPrevJson.rows) ? prevPrevJson.rows : [];

                let prevPrevAavak = 0, prevPrevJavak = 0;
                prevPrevRows.forEach(r => {
                    const amt = Number(r.amount || 0);
                    if (r.vyavharType === "aavak") prevPrevAavak += amt;
                    if (r.vyavharType === "javak") prevPrevJavak += amt;
                });

                const prevYearOpening = prevPrevAavak - prevPrevJavak;
                openingBalance = prevYearOpening + prevAavak - prevJavak;
            } catch (e) {
                openingBalance = 0;
            }

            const totalWithOpening = openingBalance + totalA;
            const closingBalance = totalWithOpening - totalJ;

            htmlTemplate = htmlTemplate
                .replace("{{dateRange}}",
                    `${formatDateToGujarati(report.from)} થી ${formatDateToGujarati(report.to)}`
                )
                .replace("{{tableRows}}", tableRows)
                .replace(/{{totalAavak}}/g, guj(totalA))
                .replace(/{{totalJavak}}/g, guj(totalJ))
                .replace(/{{grandTotal}}/g, guj(closingBalance))
                .replace(/{{openingBalance}}/g, guj(openingBalance))
                .replace(/{{totalWithOpening}}/g, guj(totalWithOpening))
                .replace(/{{closingBalance}}/g, guj(closingBalance));

            const win = window.open("", "_blank", "width=1200,height=800");
            win.document.write(htmlTemplate);
            win.document.close();
            setTimeout(() => win.print(), 500);
            setLoading(false);
            return;
        }

        // ================================
        // AAVAK / JAVAK MONTHLY REPORT
        // ================================
        const records = allRecords.filter(r => r.vyavharType === report.type);
        const monthGroups = {};
        const allCategories = new Set();

        records.forEach(rec => {
            const catKey = rec.category;
            const cat = customCategories?.[catKey] || catKey;
            const amount = Number(rec.amount) || 0;
            if (!rec.date) return;
            const d = new Date(rec.date);
            if (isNaN(d)) return;

            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            const day = d.getDate();

            if (!monthGroups[monthKey]) {
                monthGroups[monthKey] = {
                    categoriesMap: {},
                    dayTotals: Array(31).fill(0),
                    monthTotal: 0,
                };
            }

            const mg = monthGroups[monthKey];
            if (!mg.categoriesMap[catKey]) {
                mg.categoriesMap[catKey] = {
                    title: cat,
                    rowDays: Array(31).fill(0),
                    currentTotal: 0,
                };
            }

            mg.categoriesMap[catKey].rowDays[day - 1] += amount;
            mg.categoriesMap[catKey].currentTotal += amount;
            mg.dayTotals[day - 1] += amount;
            mg.monthTotal += amount;
            allCategories.add(catKey);
        });

        // Carry forward calculation
        const allSortedMonths = Object.keys(monthGroups).sort();
        const carryForward = {};
        const firstSelectedMonth = `${fromDateObj.getFullYear()}-${String(fromDateObj.getMonth() + 1).padStart(2, "0")}`;

        allSortedMonths.forEach(monthKey => {
            if (monthKey >= firstSelectedMonth) return;
            const mg = monthGroups[monthKey];
            allCategories.forEach(catKey => {
                const entry = mg.categoriesMap[catKey];
                const chaluMas = entry ? entry.currentTotal : 0;
                const gatMas = carryForward[catKey] || 0;
                carryForward[catKey] = chaluMas + gatMas;
            });
        });

        // Generate pages only for selected months
        const selectedMonths = allSortedMonths.filter(mk =>
            mk >= firstSelectedMonth &&
            mk <= `${new Date(toDate).getFullYear()}-${String(new Date(toDate).getMonth() + 1).padStart(2, "0")}`
        );

        const monthNameGuj = [
            "જાન્યુઆરી", "ફેબ્રુઆરી", "માર્ચ", "એપ્રિલ", "મે", "જૂન",
            "જુલાઈ", "ઓગસ્ટ", "સપ્ટેમ્બર", "ઓક્ટોબર", "નવેમ્બર", "ડિસેમ્બર"
        ];

        let allPagesHTML = "";

        selectedMonths.forEach((monthKey, mIdx) => {
            const mg = monthGroups[monthKey];
            const [year, m] = monthKey.split("-");
            const fyGujarati = getGujaratiFinancialYear(`${year}-01-01`);
            let pageHTML = htmlTemplate.replace(/{{yearRange}}/g, fyGujarati);

            const monthName = monthNameGuj[parseInt(m) - 1];
            let tableRows = "";
            let idx = 1;
            let totalGatMas = 0;
            let totalKulRakam = 0;

            allCategories.forEach(catKey => {
                const entry = mg.categoriesMap[catKey];
                const title = entry?.title || customCategories?.[catKey] || catKey;
                const chaluMas = entry ? entry.currentTotal : 0;
                const gatMas = carryForward[catKey] || 0;
                const kul = chaluMas + gatMas;

                totalGatMas += gatMas;
                totalKulRakam += kul;

                const dayCells = entry
                    ? entry.rowDays.map(v => `<td>${guj(v)}</td>`).join("")
                    : Array(31).fill("<td>૦</td>").join("");

                tableRows += `
                <tr>
                    <td>${idx}</td>
                    <td style="text-align:left">${title}</td>
                    ${dayCells}
                    <td>${guj(chaluMas)}</td>
                    <td>${guj(gatMas)}</td>
                    <td>${guj(kul)}</td>
                </tr>`;
                idx++;

                // Update carry forward for next month
                carryForward[catKey] = kul;
            });

            // Total row
            const totalDayCells = mg.dayTotals.map(v => `<td>${guj(v)}</td>`).join("");
            tableRows += `
            <tr style="font-weight:bold;background:#f7f7f7">
                <td colspan="2">એકાંકરે કુલ રકમ</td>
                ${totalDayCells}
                <td>${guj(mg.monthTotal)}</td>
                <td>${guj(totalGatMas)}</td>
                <td>${guj(totalKulRakam)}</td>
            </tr>`;

            pageHTML = pageHTML
                .replace("{{dateRange}}", `${monthName} ${guj(year)}`)
                .replace("{{tableRows}}", tableRows)
                .replace("{{grandTotal}}", guj(mg.monthTotal));

            allPagesHTML += pageHTML;
            if (mIdx < selectedMonths.length - 1) {
                allPagesHTML += `<div style="page-break-after: always"></div>`;
            }
        });

        const win = window.open("", "_blank", "width=1200,height=800");
        win.document.write(allPagesHTML);
        win.document.close();
        setTimeout(() => win.print(), 500);

    } catch (err) {
        console.error("Print error:", err);
        toast({
            title: "પ્રિન્ટ નિષ્ફળ",
            description: err.message || "કંઈક ખોટું થયું",
            status: "error",
            duration: 3000,
        });
    }

    setLoading(false);
};




    return (
        <Box mt={4} p={3} bg="gray.50" rounded="md">
            <HStack spacing={3} mb={3} flexWrap="wrap">
                <DateInput
                    label="From"
                    name="from"
                    value={report.from}
                    onDateChange={handleReportChange}
                    formatDisplayDate={formatDisplayDate}
                    convertToISO={convertToISO}
                />

                <DateInput
                    label="To"
                    name="to"
                    value={report.to}
                    onDateChange={handleReportChange}
                    formatDisplayDate={formatDisplayDate}
                    convertToISO={convertToISO}
                />

               <Select
    width="180px"
    value={report.type}
    onChange={(e) => handleReportChange("type", e.target.value)}
>
    <option value="aavak">આવક</option>
    <option value="javak">જાવક</option>
    <option value="checkIssue">ચેક ઈશ્યૂ</option>
    <option value="tarij">તરીજ પત્રક</option>
    <option value="rojmel">રોજમેલ</option>
</Select>


                <Button
                    colorScheme="green"
                    isLoading={loading}
                    onClick={handlePrintReport}
                    leftIcon={<Icon as={FiPrinter} />}
                >
                    પ્રિન્ટ / PDF
                </Button>
            </HStack>
        </Box>
    );
};

export default CashMelReport;