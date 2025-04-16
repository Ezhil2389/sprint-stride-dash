
import react from "@vitejs/plugin-react-swc";
import { componentTagger } from "lovable-tagger";

export const getPlugins = (mode: string) => [
  react(),
  mode === 'development' && componentTagger(),
].filter(Boolean);
