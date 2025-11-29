// frontend/src/modules/welcome_banner/index.ts
import { registerComponent } from '../../core/component_registry';
import WelcomeBannerComponent from './WelcomeBannerComponent';

export const loadWelcomeBannerModule = () => {
  registerComponent('HomePageContent', WelcomeBannerComponent);
  console.log('WelcomeBannerModule loaded and registered HomePageContent');
};
