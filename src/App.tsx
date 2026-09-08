import { AppProviders } from "@/app/AppProviders";
import { AppRoutes } from "@/app/routes";

export const App = () => (
  <AppProviders>
    <AppRoutes />
  </AppProviders>
);

export default App;
