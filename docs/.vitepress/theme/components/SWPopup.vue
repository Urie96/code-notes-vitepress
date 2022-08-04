<template>
  <transition name="sw-update-popup">
    <div v-if="enable" class="sw-update-popup" @click="reload">
      {{ message }}
      <span class="refresh">
        <svg
          viewBox="0 0 1024 1024"
          xmlns="http://www.w3.org/2000/svg"
          width="84"
          height="84"
        >
          <path
            d="M949.949 146.25v255.826c0 21.981-13.989 35.97-35.97 35.97H658.154c-13.988 0-25.983-7.992-33.973-21.981-5.997-13.989-4-27.977 7.991-39.97l79.942-77.946c-55.954-51.973-121.918-77.955-199.863-77.955-37.975 0-75.95 8.002-113.924 21.99-37.975 15.985-67.948 37.976-91.934 63.957-25.982 23.987-47.973 53.96-63.957 91.934-29.983 73.955-29.983 153.895 0 227.85 15.984 37.976 37.975 67.947 63.957 91.934 23.986 25.982 53.959 47.973 91.934 63.956 37.974 13.989 75.95 21.991 113.924 21.991 45.967 0 87.942-9.998 127.913-29.982 41.976-17.99 75.951-45.967 101.931-83.943 7.993-4 11.994-5.995 13.989-5.995 5.997 0 9.998 1.994 13.988 5.995l77.958 77.946c3.989 4 5.986 7.993 5.986 11.994 0 1.994-1.996 5.995-3.99 11.994-43.973 51.962-93.941 91.934-151.9 117.914-53.958 25.983-115.92 39.972-185.874 39.972-61.961 0-119.921-11.984-169.89-33.973-57.96-25.985-105.923-57.963-139.896-93.943-35.98-33.972-67.958-81.936-93.94-139.897-45.967-101.93-45.967-237.846 0-339.777 25.982-57.96 57.96-105.923 93.94-139.896 33.973-35.98 81.936-67.958 139.896-93.94 49.968-21.99 107.928-33.974 169.89-33.974 55.963 0 109.923 9.988 161.885 29.973 53.97 21.99 101.933 51.963 139.908 89.938l73.954-73.944c9.987-9.998 23.987-13.988 39.971-8.002 13.988 8.002 21.98 19.995 21.98 33.984z"
          />
        </svg>
      </span>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { register } from 'register-service-worker';
const enable = ref(false);
const message = '发现新内容可用';

const reload = () => {
  location.reload();
  enable.value = false;
};

addEventListener('sw-updated', () => {
  enable.value = true;
});
const emit = (name: string, event?: any) => {
  window.dispatchEvent(new CustomEvent(name, event));
};
register('/service-worker.js', {
  registrationOptions: {},
  ready() {
    console.log('Service worker is active.');
  },
  registered() {
    console.log('Service worker has been registered.');
  },
  cached() {
    console.log('Content has been cached for offline use.');
  },
  updatefound() {
    console.log('New content is downloading.');
  },
  updated() {
    emit('sw-updated');
    console.log('New content is available; please refresh.');
  },
  offline() {
    console.log(
      'No internet connection found. App is running in offline mode.'
    );
  },
  error(error) {
    console.error('Error during service worker registration:', error);
  },
});
</script>

<style lang="stylus" scoped>
@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }

  50% {
    transform: rotate(360deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.sw-update-popup {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  box-shadow: var(--box-shadow);
  background: var(--background-color);
  color: var(--text-color);
  line-height: 1.5;
  z-index: 110;
  cursor: pointer;

  .refresh {
    display: inline-block;
    vertical-align: middle;
    width: 1.5rem;
    height: 1.5rem;
    margin-left: 0.4em;
    background: #3eaf7c;
    border-radius: 0.75rem;

    svg {
      animation: rotate 3s ease infinite;
      width: 1.2em;
      height: 1.2em;
      margin: 0.15em;
      fill: var(--white, #fff);
    }
  }
}

.sw-update-popup-enter-active, .sw-update-popup-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.sw-update-popup-enter, .sw-update-popup-leave-to {
  opacity: 0;
  transform: translate(0, 50%) scale(0.5);
}
</style>
