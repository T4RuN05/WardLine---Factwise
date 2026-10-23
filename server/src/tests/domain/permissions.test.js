import { describe, it, expect } from 'vitest';
import { can, Roles, Actions } from '../../domain/permissions.js';

describe('Domain: Role Permissions (ACL-1 matrix)', () => {
  describe('NURSE role permissions', () => {
    it('can admit patient, record temperature, correct temperature', () => {
      expect(can(Roles.NURSE, Actions.ADMIT_PATIENT)).toBe(true);
      expect(can(Roles.NURSE, Actions.RECORD_TEMPERATURE)).toBe(true);
      expect(can(Roles.NURSE, Actions.CORRECT_TEMPERATURE)).toBe(true);
      expect(can(Roles.NURSE, Actions.VIEW_NURSE_WORKLIST)).toBe(true);
    });

    it('cannot log doctor visit, approve discharge, complete checkout, or record death', () => {
      expect(can(Roles.NURSE, Actions.LOG_DOCTOR_VISIT)).toBe(false);
      expect(can(Roles.NURSE, Actions.APPROVE_DISCHARGE)).toBe(false);
      expect(can(Roles.NURSE, Actions.COMPLETE_DISCHARGE)).toBe(false);
      expect(can(Roles.NURSE, Actions.RECORD_DEATH)).toBe(false);
      expect(can(Roles.NURSE, Actions.EDIT_SETTINGS)).toBe(false);
    });
  });

  describe('DOCTOR role permissions', () => {
    it('can log visit, override temperature, approve/revoke discharge, record death', () => {
      expect(can(Roles.DOCTOR, Actions.LOG_DOCTOR_VISIT)).toBe(true);
      expect(can(Roles.DOCTOR, Actions.DOCTOR_OVERRIDE_TEMPERATURE)).toBe(true);
      expect(can(Roles.DOCTOR, Actions.APPROVE_DISCHARGE)).toBe(true);
      expect(can(Roles.DOCTOR, Actions.REVOKE_DISCHARGE)).toBe(true);
      expect(can(Roles.DOCTOR, Actions.RECORD_DEATH)).toBe(true);
      expect(can(Roles.DOCTOR, Actions.VIEW_DOCTOR_ROUNDS)).toBe(true);
    });

    it('cannot admit patient or complete discharge checkout', () => {
      expect(can(Roles.DOCTOR, Actions.ADMIT_PATIENT)).toBe(false);
      expect(can(Roles.DOCTOR, Actions.COMPLETE_DISCHARGE)).toBe(false);
      expect(can(Roles.DOCTOR, Actions.EDIT_SETTINGS)).toBe(false);
    });
  });

  describe('ADMIN role permissions', () => {
    it('can admit patient, complete discharge checkout, view audit log', () => {
      expect(can(Roles.ADMIN, Actions.ADMIT_PATIENT)).toBe(true);
      expect(can(Roles.ADMIN, Actions.COMPLETE_DISCHARGE)).toBe(true);
      expect(can(Roles.ADMIN, Actions.VIEW_AUDIT_LOG)).toBe(true);
      expect(can(Roles.ADMIN, Actions.VIEW_DISCHARGE_QUEUE)).toBe(true);
    });

    it('cannot record temperature, log doctor visit, or approve discharge', () => {
      expect(can(Roles.ADMIN, Actions.RECORD_TEMPERATURE)).toBe(false);
      expect(can(Roles.ADMIN, Actions.LOG_DOCTOR_VISIT)).toBe(false);
      expect(can(Roles.ADMIN, Actions.APPROVE_DISCHARGE)).toBe(false);
      expect(can(Roles.ADMIN, Actions.RECORD_DEATH)).toBe(false);
    });
  });

  describe('DIRECTOR role permissions', () => {
    it('can view full analytics, edit settings, view audit log, and view worklists', () => {
      expect(can(Roles.DIRECTOR, Actions.VIEW_FULL_ANALYTICS)).toBe(true);
      expect(can(Roles.DIRECTOR, Actions.EDIT_SETTINGS)).toBe(true);
      expect(can(Roles.DIRECTOR, Actions.VIEW_AUDIT_LOG)).toBe(true);
      expect(can(Roles.DIRECTOR, Actions.VIEW_NURSE_WORKLIST)).toBe(true);
      expect(can(Roles.DIRECTOR, Actions.VIEW_DOCTOR_ROUNDS)).toBe(true);
    });

    it('cannot admit patient or record temperature/visit directly', () => {
      expect(can(Roles.DIRECTOR, Actions.ADMIT_PATIENT)).toBe(false);
      expect(can(Roles.DIRECTOR, Actions.RECORD_TEMPERATURE)).toBe(false);
      expect(can(Roles.DIRECTOR, Actions.LOG_DOCTOR_VISIT)).toBe(false);
      expect(can(Roles.DIRECTOR, Actions.COMPLETE_DISCHARGE)).toBe(false);
    });
  });

  describe('Unknown roles and actions', () => {
    it('returns false for unknown role or action', () => {
      expect(can('GUEST', Actions.VIEW_OVERVIEW)).toBe(false);
      expect(can(Roles.NURSE, 'UNKNOWN_ACTION')).toBe(false);
      expect(can(null, null)).toBe(false);
    });
  });
});
