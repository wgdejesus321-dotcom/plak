import { Route, Switch } from "wouter";
import { AuthProvider } from "@/lib/supabase";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import PublicPage from "@/pages/PublicPage";
import AdminDashboard from "@/pages/AdminDashboard";
import ClientEditor from "@/pages/ClientEditor";
import AdminPreview from "@/pages/AdminPreview";
import AnalyticsPage from "@/pages/AnalyticsPage";
import AccountAdmin from "@/pages/AccountAdmin";
import NotFound from "@/pages/NotFound";
export default function App() { return <AuthProvider><Switch><Route path="/" component={Home} /><Route path="/login" component={Login} /><Route path="/admin" component={AdminDashboard} /><Route path="/admin/new" component={ClientEditor} /><Route path="/admin/client/:id" component={ClientEditor} /><Route path="/admin/preview/:slug" component={AdminPreview} /><Route path="/admin/analytics/:id" component={AnalyticsPage} /><Route path="/admin/accounts" component={AccountAdmin} /><Route path="/:slug" component={PublicPage} /><Route component={NotFound} /></Switch></AuthProvider> }
