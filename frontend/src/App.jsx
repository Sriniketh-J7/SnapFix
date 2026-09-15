import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SignUp } from './pages/SignUp'
import { TechDashboard } from './pages/TechDashBoard'
import { SignIn } from './pages/SignIn'
import { UserHomePage } from './pages/UserHomePage'
import { UserReportsPage } from './pages/UserReportsPage'
import { UserNewReport } from './pages/UserNewReport'
import { FormTwo } from "./pages/FormTwo"
import { ReportDetail } from "./pages/ReportDetail"
import Profile from "./Components/UserDashboards/Profile"
import { UserLayout } from './pages/UserLayout'
import { SelectedReport } from './pages/SelectedReport'
import Explore from "./pages/Explore"
import { DeptDashboard } from './pages/DeptDashboard'
import { DeptReports } from './pages/DeptReports'
import { DeptTechnician } from './pages/DeptTechnician'
import { DeptLogin } from './pages/DeptLogin'
import { DeptReportDetail } from './pages/DeptReportDetail'
import { TechLogin } from './pages/TechLogin'
import { NotificationToast } from './Components/shared/NotificationToast'

export default function App() {
  return (
    <>
      <BrowserRouter>
        <NotificationToast />
        <Routes>
          {/* Auth */}
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/tech/login" element={<TechLogin />} />
          <Route path="/dept/login" element={<DeptLogin />} />

          {/* Technician */}
          <Route path="/TechDashboard" element={<TechDashboard />} />
          <Route path="/report/:reportId" element={<ReportDetail />} />

          {/* Department */}
          <Route path="/DeptOverview" element={<DeptDashboard />} />
          <Route path="/DeptReports" element={<DeptReports />} />
          <Route path="/DeptTechnicians" element={<DeptTechnician />} />
          <Route path="/dept/report/:id" element={<DeptReportDetail />} />

          {/* User routes with footer */}
          <Route element={<UserLayout />}>
            <Route path="/" element={<UserHomePage />} />
            <Route path="/userReportsPage" element={<UserReportsPage />} />
            <Route path="/singlereport/:reportId" element={<SelectedReport />} />
            <Route path="/reportIssue" element={<UserNewReport />} />
            <Route path="/form2" element={<FormTwo />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}
