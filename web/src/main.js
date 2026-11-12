import { mount } from 'svelte';
import './styles/fonts.css';
import './styles/global.css';
import './styles/pages.css';
import './styles/findings.css';
import App from './App.svelte';

mount(App, { target: document.getElementById('app') });
