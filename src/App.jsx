// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import Login from "./pages/Login";
// import Dashboard from "./pages/Dashboard";
// import Pedhinamu from "./pages/Pedhinamu";
// import FullForm from "./pages/FullForm";
// import Records from "./pages/Records";
// import RecordView from "./pages/RecordView";
// import PedhinamuList from "./pages/PedhinamuList";

// export default function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<Login />} />
//         <Route path="/login" element={<Login />} />
//         <Route path="/dashboard" element={<Dashboard />} />
//         <Route path="/pedhinamu" element={<Pedhinamu />} />
//         <Route path="/pedhinamu/form/:id" element={<FullForm />} />
//         <Route path="/pedhinamu/list" element={<PedhinamuList />} />
//         <Route path="/pedhinamu/edit/:id" element={<Pedhinamu />} />
//         <Route path="/records" element={<Records />} />
//         <Route path="/records/view/:id" element={<RecordView />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

import { BrowserRouter, Routes, Route } from "react-router-dom";

// Auth
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Core
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";

// Pedhinamu
import PedhinamuHome from "./pages/PedhinamuHome";
import Pedhinamu from "./pages/Pedhinamu";
import FullForm from "./pages/FullForm";
import PedhinamuList from "./pages/PedhinamuList";
import PedhinamuView from "./pages/PedhinamuView";

// Records
import Records from "./pages/Records";
import RecordView from "./pages/RecordView";

// CashMel
import CashMelForm from "./pages/CashMelForm";
import CashMelDetails from "./pages/CashMelDetails";
import CashMelView from "./pages/CashMelView";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Auth Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Core */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminPanel />} />

        {/* Pedhinamu Flow */}
        <Route path="/pedhinamu" element={<PedhinamuHome />} />
        <Route path="/pedhinamu/create" element={<Pedhinamu />} />
        <Route path="/pedhinamu/edit/:id" element={<Pedhinamu />} />
        <Route path="/pedhinamu/list" element={<PedhinamuList />} />
        <Route path="/pedhinamu/view/:id" element={<PedhinamuView />} />
        <Route path="/pedhinamu/form/:id" element={<FullForm />} />

        {/* Records */}
        <Route path="/records" element={<Records />} />
        <Route path="/records/view/:id" element={<RecordView />} />

        {/* CashMel */}
        <Route path="/cashmelform" element={<CashMelForm />} />
        <Route path="/cashmel/details" element={<CashMelDetails />} />
        <Route path="/cashmel/details/:id" element={<CashMelDetails />} />
        <Route path="/cashmel/view/:id" element={<CashMelView />} />

      </Routes>
    </BrowserRouter>
  );
}
