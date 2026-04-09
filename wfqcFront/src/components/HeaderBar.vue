<template>
  <div class="header">
    <div class="header-title">五方圈智慧建造生态集成平台</div>
    <div class="header-user">
      <el-dropdown @command="handleCommand">
        <span class="el-dropdown-link">
          <div class="user-avatar" v-if="userInfo.icon && avatarUrl">
            <img :src="avatarUrl" alt="用户头像" />
          </div>
          <el-icon v-else><User /></el-icon>
          <span class="username">{{ userInfo.nick_name || '用户' }}</span>
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">个人中心</el-dropdown-item>
            <el-dropdown-item command="settings">系统设置</el-dropdown-item>
            <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { User, ArrowDown } from '@element-plus/icons-vue'
import { userApi } from '@/api/user'
import { fileApi } from '@/api/file'

const router = useRouter()
const authStore = useAuthStore()

const userInfo = ref({
  nick_name: '',
  icon: ''
})

const avatarUrl = ref('')

const loadAvatarUrl = async (fileId) => {
  if (fileId) {
    try {
      const response = await fileApi.fileUrlsGen({ files_id: [fileId] })
      if (response.success && response.data && response.data.length > 0) {
        avatarUrl.value = response.data[0].oss_url
      }
    } catch (error) {
      console.error('获取头像URL失败:', error)
    }
  }
}

const loadUserInfo = async () => {
  if (authStore.userId) {
    try {
      const response = await userApi.userDetail({ user_id: authStore.userId })
      if (response.success) {
        userInfo.value = {
          nick_name: response.data.nick_name,
          icon: response.data.icon
        }
        if (response.data.icon) {
          await loadAvatarUrl(response.data.icon)
        }
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }
}

const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push('/userSettings')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      handleLogout()
      break
  }
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-title {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 2px;
}

.header-user {
  display: flex;
  align-items: center;
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #fff;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.el-dropdown-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.username {
  margin: 0 8px;
  font-size: 14px;
}

.el-icon--right {
  font-size: 12px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 8px;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
