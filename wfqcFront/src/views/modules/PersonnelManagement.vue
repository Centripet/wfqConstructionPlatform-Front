<template>
  <div class="personnel-management">
    <PieChart 
      :data="chartData" 
      :size="220"
      :field-options="fieldOptions"
      :default-field="'role'"
      @field-change="handleFieldChange"
    />
    
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加人员
      </el-button>
      <div class="toolbar-right">
        <el-button @click="showAdvancedSearch = true">
          <el-icon><Search /></el-icon>
          高级搜索
        </el-button>
        <el-button @click="loadData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button @click="showExportDialog = true">
          <el-icon><Download /></el-icon>
          导出Excel
        </el-button>
      </div>
    </div>
    
    <div class="content-wrapper">
      <el-table :data="tableData" style="width: 100%" v-loading="loading">
        <el-table-column 
          v-for="column in tableColumns" 
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :fixed="column.fixed"
        >
          <template #default="scope">
            <el-tag 
              v-if="column.tagType" 
              :type="column.tagType(scope.row[column.prop])"
            >
              {{ column.formatter ? column.formatter(scope.row) : (scope.row[column.prop] || '-') }}
            </el-tag>
            <span v-else-if="column.formatter">
              {{ column.formatter(scope.row) }}
            </span>
            <span v-else>
              {{ scope.row[column.prop] || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData"
        @current-change="loadData"
      />
    </div>
    
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑人员' : '添加人员'"
      width="600px"
      draggable
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item 
          v-for="field in formFields" 
          :key="field.prop"
          :label="field.label" 
          :prop="field.prop"
        >
          <el-input 
            v-if="field.type === 'input'"
            v-model="form[field.prop]" 
            :placeholder="field.placeholder" 
          />
          <el-select 
            v-else-if="field.type === 'select'"
            v-model="form[field.prop]" 
            :placeholder="field.placeholder" 
            style="width: 100%;"
            clearable
            filterable
          >
            <template v-if="field.optionsKey === 'userList'">
              <el-option 
                v-for="item in userList" 
                :key="item.user_id"
                :label="`${item.account || ''} - ${item.nick_name || ''} - ${item.department || ''}`"
                :value="item.user_id"
              >
                <span>{{ item.account || '-' }} - {{ item.nick_name || '-' }} - {{ item.department || '-' }}</span>
              </el-option>
            </template>
            <template v-else>
              <el-option 
                v-for="item in field.options" 
                :key="item[field.optionValue || 'value']"
                :label="item[field.optionLabel || 'label']" 
                :value="item[field.optionValue || 'value']" 
              />
            </template>
          </el-select>
          <el-date-picker
            v-else-if="field.type === 'date'"
            v-model="form[field.prop]"
            :type="field.dateType || 'date'"
            :placeholder="field.placeholder"
            style="width: 100%;"
            :value-format="field.valueFormat || 'YYYY-MM-DD'"
          />
          <el-input-number
            v-else-if="field.type === 'number'"
            v-model="form[field.prop]" 
            :min="field.min || 0" 
            :max="field.max" 
            :precision="field.precision" 
            style="width: 100%;" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
    
    <AdvancedSearch
      v-model:visible="showAdvancedSearch"
      title="人员高级搜索"
      :search-fields="searchFields"
      @search="handleSearch"
    />
    
    <ExportDialog
      v-model:visible="showExportDialog"
      :total="total"
      :page-size="pageSize"
      :columns="exportColumns"
      :fetch-page-data="fetchExportData"
      default-filename="人员管理"
      @close="showExportDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search, Download } from '@element-plus/icons-vue'
import { personApi } from '@/api/person'
import { userApi } from '@/api/user'
import PieChart from '@/components/PieChart.vue'
import AdvancedSearch from '@/components/AdvancedSearch.vue'
import ExportDialog from '@/components/ExportDialog.vue'

const PERMISSION_LEVEL_CONFIG = {
  1: { label: '初级', type: 'info' },
  2: { label: '中级', type: 'warning' },
  3: { label: '高级', type: 'success' }
}

const permissionLevelOptions = Object.entries(PERMISSION_LEVEL_CONFIG).map(([value, config]) => ({
  value: Number(value),
  label: config.label
}))

const searchFields = [
  { prop: 'employee_id', label: '工号', type: 'input', placeholder: '请输入工号' },
  { prop: 'person_name', label: '姓名', type: 'input', placeholder: '请输入姓名' },
  { prop: 'role', label: '角色/岗位', type: 'input', placeholder: '请输入角色/岗位' },
  { prop: 'department', label: '所属部门', type: 'input', placeholder: '请输入所属部门' },
  { prop: 'contact', label: '联系方式', type: 'input', placeholder: '请输入联系方式' },
  { prop: 'hire_date', label: '入职时间', type: 'date', placeholder: '请选择入职时间' },
  { prop: 'permission_level', label: '权限等级', type: 'select', placeholder: '请选择权限等级', options: permissionLevelOptions }
]

const tableColumns = [
  { prop: 'employee_id', label: '工号', width: '120' },
  { prop: 'person_name', label: '姓名', width: '120' },
  { prop: 'role', label: '角色/岗位', width: '120' },
  { prop: 'department', label: '所属部门', width: '150' },
  { prop: 'contact', label: '联系方式', width: '150' },
  { 
    prop: 'hire_date', 
    label: '入职时间', 
    width: '120',
    formatter: (row) => row.hire_date || '-'
  },
  { 
    prop: 'permission_level', 
    label: '权限等级', 
    width: '100',
    tagType: (val) => PERMISSION_LEVEL_CONFIG[val]?.type || 'info',
    formatter: (row) => PERMISSION_LEVEL_CONFIG[row.permission_level]?.label || '-'
  },
  { 
    prop: 'user_id', 
    label: '关联用户', 
    width: '150',
    formatter: (row) => getUserName(row.user_id)
  },
  { 
    prop: 'create_time', 
    label: '创建时间', 
    width: '180',
    formatter: (row) => formatDateTime(row.create_time)
  }
]

const formFields = [
  { 
    prop: 'user_id', 
    label: '关联用户', 
    type: 'select', 
    placeholder: '请选择关联用户',
    optionsKey: 'userList',
    optionLabel: 'user_name',
    optionValue: 'user_id',
    required: false
  },
  { 
    prop: 'employee_id', 
    label: '工号', 
    type: 'input', 
    placeholder: '请输入工号',
    required: true
  },
  { 
    prop: 'person_name', 
    label: '姓名', 
    type: 'input', 
    placeholder: '请输入姓名',
    required: true
  },
  { 
    prop: 'role', 
    label: '角色/岗位', 
    type: 'input', 
    placeholder: '请输入角色/岗位',
    required: true
  },
  { 
    prop: 'department', 
    label: '所属部门', 
    type: 'input', 
    placeholder: '请输入所属部门',
    required: true
  },
  { 
    prop: 'contact', 
    label: '联系方式', 
    type: 'input', 
    placeholder: '请输入联系方式',
    required: true
  },
  { 
    prop: 'hire_date', 
    label: '入职时间', 
    type: 'date', 
    placeholder: '请选择入职时间',
    dateType: 'date',
    valueFormat: 'YYYY-MM-DD'
  },
  { 
    prop: 'permission_level', 
    label: '权限等级', 
    type: 'select', 
    placeholder: '请选择权限等级',
    options: permissionLevelOptions,
    required: true
  }
]

const generateRules = () => {
  const rules = {}
  formFields.forEach(field => {
    if (field.required) {
      rules[field.prop] = [{ required: true, message: `请输入${field.label}`, trigger: field.type === 'select' ? 'change' : 'blur' }]
    }
  })
  return rules
}

const getInitialFormData = () => {
  const formData = { person_id: '' }
  formFields.forEach(field => {
    if (field.type === 'number') {
      formData[field.prop] = field.min || 0
    } else if (field.type === 'select') {
      formData[field.prop] = field.options ? field.options[0]?.value : ''
    } else {
      formData[field.prop] = ''
    }
  })
  return formData
}

const formatDateTime = (dateTime) => {
  if (!dateTime) return '-'
  return dateTime.replace('T', ' ').substring(0, 19)
}

const getUserName = (userId) => {
  if (!userId) return '-'
  const user = userList.value.find(u => u.user_id === userId)
  if (!user) return userId
  const parts = [user.account, user.nick_name, user.department].filter(Boolean)
  return parts.length > 0 ? parts.join(' - ') : userId
}

const loading = ref(false)
const tableData = ref([])
const userList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const form = ref(getInitialFormData())
const rules = generateRules()
const chartData = ref([])
const currentField = ref('role')

const showAdvancedSearch = ref(false)
const searchParams = ref({})
const showExportDialog = ref(false)

const exportColumns = [
  { prop: 'employee_id', label: '工号' },
  { prop: 'person_name', label: '姓名' },
  { prop: 'role', label: '角色/岗位' },
  { prop: 'department', label: '所属部门' },
  { prop: 'contact', label: '联系方式' },
  { prop: 'hire_date', label: '入职时间', formatter: (row) => row.hire_date || '-' },
  { prop: 'permission_level', label: '权限等级', formatter: (row) => PERMISSION_LEVEL_CONFIG[row.permission_level]?.label || '-' },
  { prop: 'user_id', label: '关联用户', formatter: (row) => getUserName(row.user_id) },
  { prop: 'create_time', label: '创建时间', formatter: (row) => formatDateTime(row.create_time) }
]

const fetchExportData = async (page, size) => {
  const params = {
    page,
    size,
    ...searchParams.value
  }
  const res = await personApi.personList(params)
  if (res.success) {
    return res.data?.records || []
  }
  return []
}

const fieldOptions = [
  { label: '角色', value: 'role' },
  { label: '部门', value: 'department' }
]

const loadUsers = async () => {
  try {
    const res = await userApi.userList({ page: 1, size: 100 })
    if (res.success) {
      userList.value = res.data?.records || res.data?.list || res.data || []
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
  }
}

const loadChartData = async (field = currentField.value) => {
  try {
    const res = await personApi.personCount({ field })
    if (res.success) {
      chartData.value = res.data || []
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const handleFieldChange = (field) => {
  currentField.value = field
  loadChartData(field)
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      ...searchParams.value
    }
    const res = await personApi.personList(params)
    if (res.success) {
      tableData.value = res.data?.records || []
      total.value = res.data?.total || 0
    } else {
      ElMessage.error(res.message || '加载数据失败')
    }
    await loadChartData()
  } catch {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = (params) => {
  searchParams.value = params
  currentPage.value = 1
  loadData()
}

const handleAdd = () => {
  isEdit.value = false
  form.value = getInitialFormData()
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
          res = await personApi.personModify(form.value)
        } else {
          res = await personApi.personSubmit(form.value)
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
    `确定要删除人员 "${row.person_name}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await personApi.personDelete({ person_id: row.person_id })
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
  loadUsers()
  loadData()
  loadChartData()
})
</script>

<style scoped>
.personnel-management {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 120px);
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
}

.search-bar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

.toolbar-right {
  display: flex;
  gap: 10px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

:deep(.el-table__cell) {
  padding: 12px 0;
  height: 50px;
  line-height: 26px;
}
</style>
