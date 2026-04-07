<template>
  <div class="equipment-management">
    <div class="search-bar">
      <el-select v-model="selectedProjectId" placeholder="请选择项目" clearable @change="loadData">
        <el-option
          v-for="proj in projectList"
          :key="proj.project_id"
          :label="proj.project_name"
          :value="proj.project_id"
        />
      </el-select>
      <el-input v-model="searchKeyword" placeholder="搜索设备名称" style="width: 300px; margin-left: 10px;" clearable />
    </div>
    
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加设备
      </el-button>
      <el-button @click="loadData">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>
    
    <el-table :data="tableData" style="width: 100%" v-loading="loading">
      <el-table-column label="所属项目" width="150">
        <template #default="scope">
          {{ getProjectName(scope.row.project_id) }}
        </template>
      </el-table-column>
      <el-table-column prop="device_name" label="设备名称" width="180" />
      <el-table-column prop="device_type" label="设备类型" width="120" />
      <el-table-column label="设备状态" width="120">
        <template #default="scope">
          <el-tag :type="getDeviceStatusType(scope.row.device_status)">
            {{ getDeviceStatusText(scope.row.device_status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="device_location" label="设备位置" width="150" />
      <el-table-column label="运行时间" width="120">
        <template #default="scope">
          {{ scope.row.running_time || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="battery" label="电量(%)" width="100" />
      <el-table-column prop="temperature" label="温度(°C)" width="120" />
      <el-table-column label="报警状态" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.alarm_status === 1 ? 'danger' : 'success'">
            {{ scope.row.alarm_status === 1 ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="上次维护" width="120">
        <template #default="scope">
          {{ scope.row.last_maintenance_time || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="200">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="total"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="loadData"
      @current-change="loadData"
      style="margin-top: 20px; justify-content: flex-end; display: flex;"
    />
    
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑设备' : '添加设备'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="所属项目" prop="project_id">
          <el-select v-model="form.project_id" placeholder="请选择项目" style="width: 100%;">
            <el-option
              v-for="proj in projectList"
              :key="proj.project_id"
              :label="proj.project_name"
              :value="proj.project_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="设备名称" prop="device_name">
          <el-input v-model="form.device_name" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="设备类型" prop="device_type">
          <el-input v-model="form.device_type" placeholder="请输入设备类型" />
        </el-form-item>
        <el-form-item label="设备状态" prop="device_status">
          <el-select v-model="form.device_status" placeholder="请选择设备状态" style="width: 100%;">
            <el-option label="闲置" :value="0" />
            <el-option label="使用中" :value="1" />
            <el-option label="维修中" :value="2" />
            <el-option label="报废" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备位置" prop="device_location">
          <el-input v-model="form.device_location" placeholder="请输入设备位置" />
        </el-form-item>
        <el-form-item label="运行时间" prop="running_time">
          <el-date-picker
            v-model="form.running_time"
            type="date"
            placeholder="请选择运行时间"
            style="width: 100%;"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="电量(%)" prop="battery">
          <el-input-number v-model="form.battery" :min="0" :max="100" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="温度(°C)" prop="temperature">
          <el-input-number v-model="form.temperature" :precision="1" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="报警状态" prop="alarm_status">
          <el-select v-model="form.alarm_status" placeholder="请选择报警状态" style="width: 100%;">
            <el-option label="否" :value="0" />
            <el-option label="是" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="上次维护" prop="last_maintenance_time">
          <el-date-picker
            v-model="form.last_maintenance_time"
            type="date"
            placeholder="请选择上次维护时间"
            style="width: 100%;"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { deviceApi } from '@/api/device'
import { projectApi } from '@/api/project'

const loading = ref(false)
const tableData = ref([])
const projectList = ref([])
const selectedProjectId = ref('')
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const form = ref({
  device_id: '',
  project_id: '',
  device_name: '',
  device_type: '',
  device_status: 0,
  device_location: '',
  running_time: '',
  battery: 0,
  temperature: 0,
  alarm_status: 0,
  last_maintenance_time: ''
})

const rules = {
  project_id: [{ required: true, message: '请选择项目', trigger: 'change' }],
  device_name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }]
}

const loadProjects = async () => {
  try {
    const res = await projectApi.projectList({ page: 1, size: 100 })
    if (res.success) {
      projectList.value = res.data?.records || res.data?.list || res.data || []
    }
  } catch (error) {
    console.error('加载项目列表失败:', error)
  }
}

const getProjectName = (projectId) => {
  const project = projectList.value.find(p => p.project_id === projectId)
  return project ? project.project_name : '-'
}

const getDeviceStatusType = (status) => {
  const statusMap = { 0: 'info', 1: 'success', 2: 'warning', 3: 'danger' }
  return statusMap[status] || 'info'
}

const getDeviceStatusText = (status) => {
  const statusMap = { 0: '闲置', 1: '使用中', 2: '维修中', 3: '报废' }
  return statusMap[status] || '未知'
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value
    }
    if (selectedProjectId.value) {
      params.project_id = selectedProjectId.value
    }
    const res = await deviceApi.deviceList(params)
    if (res.success) {
      tableData.value = res.data?.records || []
      total.value = res.data?.total || 0
    } else {
      ElMessage.error(res.message || '加载数据失败')
    }
  } catch {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  form.value = {
    device_id: '',
    project_id: selectedProjectId.value || '',
    device_name: '',
    device_type: '',
    device_status: 0,
    device_location: '',
    running_time: '',
    battery: 0,
    temperature: 0,
    alarm_status: 0,
    last_maintenance_time: ''
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        let res
        if (isEdit.value) {
          res = await deviceApi.deviceModify(form.value)
        } else {
          res = await deviceApi.deviceSubmit(form.value)
        }
        if (res.success) {
          ElMessage.success(isEdit.value ? '修改成功' : '添加成功')
          dialogVisible.value = false
          loadData()
        } else {
          ElMessage.error(res.message || '操作失败')
        }
      } catch {
        ElMessage.error('操作失败')
      }
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除设备 "${row.device_name}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await deviceApi.deviceDelete({ device_id: row.device_id })
      if (res.success) {
        ElMessage.success('删除成功')
        loadData()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    } catch {
      ElMessage.error('删除失败')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

onMounted(() => {
  loadProjects()
  loadData()
})
</script>

<style scoped>
.equipment-management {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
}

.search-bar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.search-bar .el-select {
  width: 300px;
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}
</style>
