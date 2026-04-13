<template>
  <div class="user-settings-container">
    <div class="settings-header">
      <div class="header-left">
        <el-button type="primary" @click="goBack" icon="el-icon-back">返回</el-button>
        <h2>用户设置</h2>
      </div>
    </div>
    
    <div class="settings-content">
      <el-card class="user-info-card">
        <template #header>
          <div class="card-header">
            <span>个人信息</span>
            <el-button type="primary" @click="enterEditMode" v-if="!isEditing">修改</el-button>
          </div>
        </template>
        
        <div class="user-info-form">
          <div class="form-row">
            <div class="avatar-upload-section">
              <AvatarUploader
                v-model="avatarFile"
                @update:modelValue="handleAvatarChange"
              />
            </div>
            
            <div class="form-fields">
              <el-form :model="userForm" label-width="100px" :disabled="!isEditing" class="user-form">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="昵称">
                      <el-input v-model="userForm.nick_name" class="info-input" />
                    </el-form-item>
                    
                    <el-form-item label="性别">
                      <el-select v-model="userForm.sex" placeholder="请选择" class="info-select">
                        <el-option label="男" value="男" />
                        <el-option label="女" value="女" />
                        <el-option label="未知" value="未知" />
                      </el-select>
                    </el-form-item>
                    
                    <el-form-item label="账号">
                      <el-input v-model="userForm.account" disabled class="info-input" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="手机号">
                      <el-input v-model="userForm.phone" disabled class="info-input" />
                    </el-form-item>
                    
                    <el-form-item label="组织">
                      <el-input v-model="userForm.organization" disabled class="info-input" />
                    </el-form-item>
                    
                    <el-form-item label="部门">
                      <el-input v-model="userForm.department" disabled class="info-input" />
                    </el-form-item>
                    
                    <el-form-item label="角色">
                      <el-input v-model="userForm.role" disabled class="info-input" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </div>
          </div>
        </div>
        
        <div class="form-actions" v-if="isEditing">
          <el-button type="primary" @click="saveChanges" :loading="saving">保存修改</el-button>
          <el-button @click="cancelChanges">取消</el-button>
        </div>
      </el-card>
      
      <el-card class="password-reset-card">
        <template #header>
          <div class="card-header">
            <span>密码设置</span>
          </div>
        </template>
        
        <div class="password-reset-form">
          <el-form :model="passwordForm" label-width="120px" class="password-form">
            <el-form-item label="原密码">
              <el-input 
                v-model="passwordForm.passwordHashOld" 
                type="password" 
                placeholder="请输入原密码"
                class="info-input"
              />
            </el-form-item>
            
            <el-form-item label="新密码">
              <el-input 
                v-model="passwordForm.passwordHash" 
                type="password" 
                placeholder="请输入新密码（6-20位，包含大小写字母和数字）"
                class="info-input"
              />
            </el-form-item>
            
            <el-form-item label="确认新密码">
              <el-input 
                v-model="passwordForm.passwordHashRe" 
                type="password" 
                placeholder="请再次输入新密码"
                class="info-input"
              />
            </el-form-item>
          </el-form>
        </div>
        
        <div class="form-actions">
          <el-button type="primary" @click="resetPassword" :loading="resetting">重置密码</el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { userApi } from '@/api/user'
import AvatarUploader from '@/components/AvatarUploader.vue'

const router = useRouter()
const authStore = useAuthStore()

const isEditing = ref(false)
const saving = ref(false)
const resetting = ref(false)
const avatarFile = ref(null)

const userInfo = ref({
  user_id: '',
  nick_name: '',
  sex: '',
  icon: '',
  account: '',
  phone: '',
  organization: '',
  department: '',
  role: ''
})

const userForm = reactive({
  user_id: '',
  nick_name: '',
  sex: '',
  icon: ''
})

const passwordForm = reactive({
  passwordHashOld: '',
  passwordHash: '',
  passwordHashRe: ''
})

const goBack = () => {
  router.push('/dashboard')
}

const enterEditMode = () => {
  isEditing.value = true
}

const handleAvatarChange = (file) => {
  if (file) {
    userForm.icon = file.file_id
  } else {
    userForm.icon = null
  }
}

const loadUserInfo = async () => {
  try {
    const response = await userApi.userSelfDetail()
    if (response.success) {
      userInfo.value = response.data
      userForm.user_id = response.data.user_id
      userForm.nick_name = response.data.nick_name
      userForm.sex = response.data.sex
      userForm.icon = response.data.icon
      userForm.account = response.data.account
      userForm.phone = response.data.phone
      userForm.organization = response.data.organization
      userForm.department = response.data.department
      userForm.role = response.data.role
      
      if (response.data.icon) {
        avatarFile.value = {
          file_id: response.data.icon,
          origin_name: 'avatar.jpg',
          suffix: '.jpg',
          file_size: 0
        }
      }
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error('获取用户信息失败')
  }
}

const saveChanges = async () => {
  try {
    saving.value = true
    const response = await userApi.userModify(userForm)
    if (response.success) {
      ElMessage.success('修改成功')
      isEditing.value = false
      loadUserInfo()
    } else {
      ElMessage.error('修改失败')
    }
  } catch (error) {
    console.error('修改用户信息失败:', error)
    ElMessage.error('修改失败')
  } finally {
    saving.value = false
  }
}

const cancelChanges = () => {
  isEditing.value = false
  loadUserInfo()
}

const resetPassword = async () => {
  // 表单验证
  if (!passwordForm.passwordHashOld) {
    ElMessage.error('请输入原密码')
    return
  }
  if (!passwordForm.passwordHash) {
    ElMessage.error('请输入新密码')
    return
  }
  if (passwordForm.passwordHash.length < 6 || passwordForm.passwordHash.length > 20) {
    ElMessage.error('密码长度必须在6到20位之间')
    return
  }
  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/.test(passwordForm.passwordHash)) {
    ElMessage.error('密码必须包含大小写字母和数字')
    return
  }
  if (passwordForm.passwordHash !== passwordForm.passwordHashRe) {
    ElMessage.error('两次输入的密码不一致')
    return
  }
  
  try {
    resetting.value = true
    const response = await userApi.resetPassword(passwordForm)
    if (response.success) {
      ElMessage.success('重置密码成功')
      // 重置表单
      passwordForm.passwordHashOld = ''
      passwordForm.passwordHash = ''
      passwordForm.passwordHashRe = ''
    } else {
      ElMessage.error('重置密码失败')
    }
  } catch (error) {
    console.error('重置密码失败:', error)
    ElMessage.error('重置密码失败')
  } finally {
    resetting.value = false
  }
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.user-settings-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.settings-header {
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h2 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.user-info-card {
  margin-bottom: 24px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fafafa;
}

.card-header span {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.user-info-form {
  padding: 30px 20px;
}

.form-row {
  display: flex;
  gap: 60px;
  align-items: flex-start;
}

.avatar-upload-section {
  flex-shrink: 0;
}

.form-fields {
  flex: 1;
}

.user-form {
  width: 100%;
}

.info-input,
.info-select {
  width: 100%;
}

.form-actions {
  margin-top: 30px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 30px;
  }
  
  .avatar-upload-section {
    align-self: center;
  }
  
  .el-row {
    flex-direction: column;
  }
  
  .el-col {
    width: 100% !important;
  }
}
</style>