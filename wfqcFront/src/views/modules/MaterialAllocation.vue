<template>
  <div class="material-allocation">
    <div class="search-bar">
      <el-select v-model="selectedTransferOutId" placeholder="请选择调出项目" clearable @change="loadData" style="width: 280px;">
        <el-option
          v-for="proj in projectList"
          :key="proj.project_id"
          :label="proj.project_name"
          :value="proj.project_id"
        />
      </el-select>
      <el-select v-model="selectedTransferInId" placeholder="请选择调入项目" clearable @change="loadData" style="width: 280px; margin-left: 10px;">
        <el-option
          v-for="proj in projectList"
          :key="proj.project_id"
          :label="proj.project_name"
          :value="proj.project_id"
        />
      </el-select>
    </div>
    
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加调配
      </el-button>
      <el-button @click="loadData">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>
    
    <el-table :data="tableData" style="width: 100%" v-loading="loading">
      <el-table-column prop="material_name" label="物资名称" width="150" />
      <el-table-column prop="material_specification" label="规格型号" width="120" />
      <el-table-column label="调出项目" width="180">
        <template #default="scope">
          {{ getProjectName(scope.row.transfer_out_project_id) }}
        </template>
      </el-table-column>
      <el-table-column label="调入项目" width="180">
        <template #default="scope">
          {{ getProjectName(scope.row.transfer_in_project_id) }}
        </template>
      </el-table-column>
      <el-table-column prop="allocation_number" label="调配数量" width="100" />
      <el-table-column prop="allocation_unit" label="单位" width="80" />
      <el-table-column label="调配时间" width="120">
        <template #default="scope">
          {{ scope.row.allocation_time || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="allocation_responsible" label="负责人" width="120" />
      <el-table-column prop="remarks" label="备注" show-overflow-tooltip />
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
      :title="isEdit ? '编辑调配' : '添加调配'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="130px">
        <el-form-item label="物资名称" prop="material_name">
          <el-input v-model="form.material_name" placeholder="请输入物资名称" />
        </el-form-item>
        <el-form-item label="规格型号" prop="material_specification">
          <el-input v-model="form.material_specification" placeholder="请输入规格型号" />
        </el-form-item>
        <el-form-item label="调出项目" prop="transfer_out_project_id">
          <el-select v-model="form.transfer_out_project_id" placeholder="请选择调出项目" style="width: 100%;">
            <el-option
              v-for="proj in projectList"
              :key="proj.project_id"
              :label="proj.project_name"
              :value="proj.project_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="调入项目" prop="transfer_in_project_id">
          <el-select v-model="form.transfer_in_project_id" placeholder="请选择调入项目" style="width: 100%;">
            <el-option
              v-for="proj in projectList"
              :key="proj.project_id"
              :label="proj.project_name"
              :value="proj.project_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="调配数量" prop="allocation_number">
          <el-input-number v-model="form.allocation_number" :min="1" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="单位" prop="allocation_unit">
          <el-input v-model="form.allocation_unit" placeholder="请输入单位" />
        </el-form-item>
        <el-form-item label="调配时间" prop="allocation_time">
          <el-date-picker
            v-model="form.allocation_time"
            type="date"
            placeholder="请选择调配时间"
            style="width: 100%;"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="负责人" prop="allocation_responsible">
          <el-input v-model="form.allocation_responsible" placeholder="请输入负责人" />
        </el-form-item>
        <el-form-item label="备注" prop="remarks">
          <el-input v-model="form.remarks" type="textarea" :rows="3" placeholder="请输入备注" />
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
import { materialAllocationApi } from '@/api/materialAllocation'
import { projectApi } from '@/api/project'

const loading = ref(false)
const tableData = ref([])
const projectList = ref([])
const selectedTransferOutId = ref('')
const selectedTransferInId = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const form = ref({
  material_id: '',
  material_name: '',
  material_specification: '',
  transfer_out_project_id: '',
  transfer_in_project_id: '',
  allocation_number: 1,
  allocation_unit: '',
  allocation_time: '',
  allocation_responsible: '',
  remarks: ''
})

const rules = {
  material_name: [{ required: true, message: '请输入物资名称', trigger: 'blur' }],
  transfer_out_project_id: [{ required: true, message: '请选择调出项目', trigger: 'change' }],
  transfer_in_project_id: [{ required: true, message: '请选择调入项目', trigger: 'change' }],
  allocation_time: [{ required: true, message: '请选择调配时间', trigger: 'change' }],
  allocation_responsible: [{ required: true, message: '请输入负责人', trigger: 'blur' }]
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

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value
    }
    if (selectedTransferOutId.value) {
      params.transfer_out_project_id = selectedTransferOutId.value
    }
    if (selectedTransferInId.value) {
      params.transfer_in_project_id = selectedTransferInId.value
    }
    const res = await materialAllocationApi.materialAllocationList(params)
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
    material_id: '',
    material_name: '',
    material_specification: '',
    transfer_out_project_id: '',
    transfer_in_project_id: '',
    allocation_number: 1,
    allocation_unit: '',
    allocation_time: '',
    allocation_responsible: '',
    remarks: ''
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
          res = await materialAllocationApi.materialAllocationModify(form.value)
        } else {
          res = await materialAllocationApi.materialAllocationSubmit(form.value)
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
    `确定要删除调配 "${row.material_name}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await materialAllocationApi.materialAllocationDelete({ material_id: row.material_id })
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
.material-allocation {
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
