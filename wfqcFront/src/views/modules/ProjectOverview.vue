<template>
  <div class="project-overview">
    <div class="search-bar">
      <el-input v-model="searchKeyword" placeholder="搜索项目名称或地点" style="width: 300px; margin-right: 10px;" clearable />
      <el-select v-model="searchStatus" placeholder="请选择状态" clearable style="width: 200px;">
        <el-option label="未开始" :value="0" />
        <el-option label="进行中" :value="1" />
        <el-option label="已完成" :value="2" />
        <el-option label="暂停" :value="3" />
      </el-select>
    </div>
    
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增项目
      </el-button>
      <el-button @click="loadData">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>
    
    <el-table :data="tableData" style="width: 100%" v-loading="loading">
      <el-table-column prop="project_name" label="项目名称" width="200" />
      <el-table-column prop="cp_project_place" label="项目地点" width="150" />
      <el-table-column label="项目状态" width="120">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.cp_project_status)">
            {{ getStatusText(scope.row.cp_project_status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="cp_project_manager" label="项目经理" width="120" />
      <el-table-column label="开始日期" width="120">
        <template #default="scope">
          {{ scope.row.cp_start_date || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="预计完成" width="120">
        <template #default="scope">
          {{ scope.row.cp_expected_completion_date || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="实际完成" width="120">
        <template #default="scope">
          {{ scope.row.cp_actual_completion_date || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="cp_project_budget" label="项目预算" width="120" />
      <el-table-column prop="cp_invested_funds" label="已投入资金" width="120" />
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
      :title="isEdit ? '编辑项目' : '新增项目'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="项目名称" prop="project_name">
          <el-input v-model="form.project_name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目地点" prop="cp_project_place">
          <el-input v-model="form.cp_project_place" placeholder="请输入项目地点" />
        </el-form-item>
        <el-form-item label="项目状态" prop="cp_project_status">
          <el-select v-model="form.cp_project_status" placeholder="请选择项目状态" style="width: 100%;">
            <el-option label="未开始" :value="0" />
            <el-option label="进行中" :value="1" />
            <el-option label="已完成" :value="2" />
            <el-option label="暂停" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="项目经理" prop="cp_project_manager">
          <el-input v-model="form.cp_project_manager" placeholder="请输入项目经理" />
        </el-form-item>
        <el-form-item label="开始日期" prop="cp_start_date">
          <el-date-picker
            v-model="form.cp_start_date"
            type="date"
            placeholder="请选择开始日期"
            style="width: 100%;"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="预计完成" prop="cp_expected_completion_date">
          <el-date-picker
            v-model="form.cp_expected_completion_date"
            type="date"
            placeholder="请选择预计完成日期"
            style="width: 100%;"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="实际完成" prop="cp_actual_completion_date">
          <el-date-picker
            v-model="form.cp_actual_completion_date"
            type="date"
            placeholder="请选择实际完成日期"
            style="width: 100%;"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="项目预算" prop="cp_project_budget">
          <el-input-number v-model="form.cp_project_budget" :min="0" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="已投入资金" prop="cp_invested_funds">
          <el-input-number v-model="form.cp_invested_funds" :min="0" :precision="2" style="width: 100%;" />
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
import { projectApi } from '@/api/project'

const loading = ref(false)
const tableData = ref([])
const searchKeyword = ref('')
const searchStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const form = ref({
  project_id: '',
  project_name: '',
  cp_project_place: '',
  cp_project_status: 0,
  cp_project_manager: '',
  cp_start_date: '',
  cp_expected_completion_date: '',
  cp_actual_completion_date: '',
  cp_project_budget: 0,
  cp_invested_funds: 0
})

const rules = {
  project_name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  cp_project_place: [{ required: true, message: '请输入项目地点', trigger: 'blur' }],
  cp_project_status: [{ required: true, message: '请选择项目状态', trigger: 'change' }]
}

const getStatusType = (status) => {
  const statusMap = { 0: 'info', 1: 'primary', 2: 'success', 3: 'warning' }
  return statusMap[status] || 'info'
}

const getStatusText = (status) => {
  const statusMap = { 0: '未开始', 1: '进行中', 2: '已完成', 3: '暂停' }
  return statusMap[status] || '未知'
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value
    }
    if (searchKeyword.value) {
      params.project_name = searchKeyword.value
    }
    if (searchStatus.value !== '') {
      params.cp_project_status = searchStatus.value
    }
    const res = await projectApi.projectList(params)
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
    project_id: '',
    project_name: '',
    cp_project_place: '',
    cp_project_status: 0,
    cp_project_manager: '',
    cp_start_date: '',
    cp_expected_completion_date: '',
    cp_actual_completion_date: '',
    cp_project_budget: 0,
    cp_invested_funds: 0
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
          res = await projectApi.projectModify(form.value)
        } else {
          res = await projectApi.projectSubmit(form.value)
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
    `确定要删除项目 "${row.project_name}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await projectApi.projectDelete({ project_id: row.project_id })
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
  loadData()
})
</script>

<style scoped>
.project-overview {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
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
}
</style>
