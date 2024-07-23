<template>
  <div ref="container" />
</template>

<script setup>
import { onMounted, ref } from 'vue';
import 'asciinema-player/dist/bundle/asciinema-player.css';

const props = defineProps({
  src: String,
  startAt: Number,
});

const container = ref(null);

onMounted(async () => {
  const AsciinemaPlayer = await import('asciinema-player');
  const options = {
    idleTimeLimit: 2,
    controls: true,
  };
  if (props.startAt !== undefined) {
    options.startAt = props.startAt;
    options.poster = `npt:0:${props.startAt}`;
  }

  AsciinemaPlayer.create(props.src, container.value, options);
});
</script>