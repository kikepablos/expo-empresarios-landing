import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import GalleryPage from "@/pages/GalleryPage";
import RegisterPage from "@/pages/RegisterPage";
import RegisterExpositorPage from "@/pages/RegisterExpositorPage";
import LoginPage from "@/pages/LoginPage";
import RecoverPasswordPage from "@/pages/RecoverPasswordPage";
import ChangePasswordPage from "@/pages/ChangePasswordPage";
import ExpositorDetailPage from "@/pages/ExpositorDetailPage";
import ProfilePage from "@/pages/ProfilePage";
import InvitadoDetailPage from "@/pages/InvitadoDetailPage";
import MisContactosPage from "@/pages/MisContactosPage";
import MisInvitadosPage from "@/pages/MisInvitadosPage";
import MisCitasPage from "@/pages/MisCitasPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/galeria" component={GalleryPage} />
      <Route path="/registro" component={RegisterPage} />
      <Route path="/registro-expositor" component={RegisterExpositorPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/recuperar-contrasena" component={RecoverPasswordPage} />
      <Route path="/cambiar-contrasena" component={ChangePasswordPage} />
      <Route path="/expositor/:id" component={ExpositorDetailPage} />
      <Route path="/invitado/:id" component={InvitadoDetailPage} />
      <Route path="/mi-perfil" component={ProfilePage} />
      <Route path="/mis-contactos" component={MisContactosPage} />
      <Route path="/mis-invitados" component={MisInvitadosPage} />
      <Route path="/mis-citas" component={MisCitasPage} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
