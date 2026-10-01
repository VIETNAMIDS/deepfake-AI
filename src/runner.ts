import { startAllServices } from "./index";

if (require.main === module) {
  startAllServices();
}

export { startAllServices };
