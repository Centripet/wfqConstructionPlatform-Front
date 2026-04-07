<template>
  <div class="dashboard-container">
    <HeaderBar />
    <div class="dashboard-body">
      <SidebarMenu @menu-select="handleMenuSelect" />
      <ContentArea :active-menu="activeMenu" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import HeaderBar from '@/components/HeaderBar.vue'
import SidebarMenu from '@/components/SidebarMenu.vue'
import ContentArea from '@/components/ContentArea.vue'

const activeMenu = ref('personnel')

const handleMenuSelect = (menu) => {
  activeMenu.value = menu
}
</script>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.dashboard-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>
