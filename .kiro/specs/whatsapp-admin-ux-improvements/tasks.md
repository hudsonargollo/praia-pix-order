# Implementation Plan

- [x] 1. Update WhatsApp Admin page spacing and sizing
  - Reduce header padding from `py-3 sm:py-4` to `py-2 sm:py-3`
  - Reduce logo size from `h-8 sm:h-10` to `h-7 sm:h-10`
  - Change header title size from `text-lg sm:text-2xl` to `text-base sm:text-2xl`
  - Update subtitle visibility from `hidden sm:block` to `hidden md:block`
  - Shorten subtitle text to "Monitoramento e gerenciamento"
  - Reduce main container padding from `py-4 sm:py-8` to `py-3 sm:py-6`
  - Update connection alert padding to `p-3 sm:p-4` and margin to `mb-4`
  - Reduce stats grid gap from `gap-3 sm:gap-6` to `gap-2 sm:gap-4`
  - Reduce stats grid margin from `mb-6 sm:mb-8` to `mb-4 sm:mb-6`
  - Reduce action cards gap from `gap-4 sm:gap-6` to `gap-3 sm:gap-4`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.5_

- [x] 2. Update stats cards layout and content
  - Add custom CardHeader padding: `p-3 sm:p-6 pb-1 sm:pb-2`
  - Add custom CardContent padding: `p-3 pt-0 sm:p-6 sm:pt-0`
  - Change stats number size from `text-lg sm:text-2xl` to `text-xl sm:text-2xl`
  - Simplify delivery rate text from "Taxa: 97.7%" to just "97.7%"
  - Ensure all 4 stats cards use consistent padding and sizing
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 8.2_

- [x] 3. Update connection status alert content
  - Add custom alert padding: `p-3 sm:p-4`
  - Change AlertTitle size to `text-sm sm:text-base`
  - Change AlertDescription size to `text-xs sm:text-sm`
  - Reduce space-y from `space-y-1` to `space-y-0.5`
  - Abbreviate "Telefone:" to "Tel:"
  - Hide connection timestamp on mobile with `hidden sm:block`
  - Remove profile name display (not essential)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 8.1, 8.3_

- [x] 4. Update action cards layout and content
  - Add custom CardHeader padding: `p-4 sm:p-6 pb-2 sm:pb-4`
  - Add custom CardContent padding: `p-4 pt-0 sm:p-6 sm:pt-0`
  - Change CardTitle size to `text-base sm:text-lg`
  - Change icon size from `h-5 w-5` to `h-4 w-4 sm:h-5 sm:w-5`
  - Change CardDescription size to `text-xs sm:text-sm`
  - Shorten "Teste de Conexão" description to "Envie mensagem de teste"
  - Shorten "Gerenciar Conexão" description to "Conectar ou desconectar"
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.1_

- [x] 5. Update QR code dialog layout
  - Change DialogTitle size to `text-base sm:text-lg`
  - Change DialogDescription size to `text-xs sm:text-sm`
  - Reduce dialog content padding from `py-6` to `py-4 sm:py-6`
  - Reduce space-y from `space-y-4` to `space-y-3 sm:space-y-4`
  - Change QR code size from `w-48 h-48 sm:w-64 sm:h-64` to `w-48 h-48 sm:w-56 sm:h-56`
  - Reduce QR code container padding from `p-4` to `p-3 sm:p-4`
  - Change instruction title size to `text-xs sm:text-sm`
  - Reduce instruction spacing from `space-y-1` to `space-y-0.5 sm:space-y-1`
  - Shorten instruction text: "Conectar aparelho" (remove "um")
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 8.1_

- [x] 6. Test responsive layout across devices
  - Verify header is compact on mobile (iPhone SE 375x667)
  - Verify stats cards display properly in 2-column grid on mobile
  - Verify all text is readable at smaller sizes
  - Verify buttons maintain 44px+ height for easy tapping
  - Verify QR code is scannable at reduced size (200px)
  - Verify no horizontal scrolling on any device size
  - Verify reduced spacing doesn't cause layout issues
  - Verify desktop layout (768px+) still looks good
  - Verify all interactive elements work correctly
  - _Requirements: 1.1, 2.1, 4.3, 6.1, 6.5, 7.4_
