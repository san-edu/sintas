import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  academicKeys,
  createClass,
  createEducationLevel,
  createSubject,
  deleteClass,
  deleteEducationLevel,
  deleteSubject,
  getClasses,
  getEducationLevels,
  getSubjects,
  updateClass,
  updateEducationLevel,
  updateSubject,
} from '../../../services/academicService'

export function useEducationLevels(filters = {}) {
  return useQuery({
    queryKey: academicKeys.educationLevels(filters),
    queryFn: () => getEducationLevels(filters),
    placeholderData: (previous) => previous,
  })
}

export function useClasses(filters = {}) {
  return useQuery({
    queryKey: academicKeys.classes(filters),
    queryFn: () => getClasses(filters),
    placeholderData: (previous) => previous,
  })
}

export function useSubjects(filters = {}) {
  return useQuery({
    queryKey: academicKeys.subjects(filters),
    queryFn: () => getSubjects(filters),
    placeholderData: (previous) => previous,
  })
}

function useMutationFactory(mutationFn, keyFactory) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: keyFactory() })
    },
  })
}

export function useCreateEducationLevel() {
  return useMutationFactory(createEducationLevel, academicKeys.educationLevels)
}

export function useUpdateEducationLevel() {
  return useMutationFactory(({ id, data }) => updateEducationLevel(id, data), academicKeys.educationLevels)
}

export function useDeleteEducationLevel() {
  return useMutationFactory(deleteEducationLevel, academicKeys.educationLevels)
}

export function useCreateClass() {
  return useMutationFactory(createClass, academicKeys.classes)
}

export function useUpdateClass() {
  return useMutationFactory(({ id, data }) => updateClass(id, data), academicKeys.classes)
}

export function useDeleteClass() {
  return useMutationFactory(deleteClass, academicKeys.classes)
}

export function useCreateSubject() {
  return useMutationFactory(createSubject, academicKeys.subjects)
}

export function useUpdateSubject() {
  return useMutationFactory(({ id, data }) => updateSubject(id, data), academicKeys.subjects)
}

export function useDeleteSubject() {
  return useMutationFactory(deleteSubject, academicKeys.subjects)
}