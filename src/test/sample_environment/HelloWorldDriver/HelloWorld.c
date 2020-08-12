/** @file HelloWorld.c

 **/

#include <Library/UefiBootServicesTableLib.h>
#include <Library/UefiRuntimeServicesTableLib.h>
#include <Library/BaseLib.h>
#include <Library/DebugLib.h>
#include <Library/PcdLib.h>
#include <Uefi/UefiBaseType.h>
#include <Uefi/UefiSpec.h>

/**
The driver's entry point.

@param[in] ImageHandle  The firmware allocated handle for the EFI image.
@param[in] SystemTable  A pointer to the EFI System Table.

@retval EFI_SUCCESS   The entry point is executed successfully.
@retval other         Some error occurs when executing this entry point.

**/
EFI_STATUS
EFIAPI
HelloWorldEntry (
  IN  EFI_HANDLE        ImageHandle,
  IN  EFI_SYSTEM_TABLE  *SystemTable
  )
{
  UINT32      NumberOfParallelUniverses = 0;
  UINTN       Size = sizeof(NumberOfParallelUniverses);
  EFI_STATUS  Status = EFI_UNSUPPORTED;

  DEBUG ((DEBUG_INFO, "[%a] - The number of parallel universes we know is : %d\n", __FUNCTION__, NumberOfParallelUniverses));

  Status = gRT->GetVariable (
                  L"HelloWorld",
                  &gMsHelloWorldGuid,
                  NULL,
                  &Size,
                  (VOID*)&NumberOfParallelUniverses
                  );

  if (EFI_ERROR (Status)) {
    DEBUG ((DEBUG_ERROR, "[%a] - Hello world variable not found. Status - %r.\n", __FUNCTION__, Status));
    Status = gRT->SetVariable (
                    L"HelloWorld",
                    &gMsHelloWorldGuid,
                    NULL,
                    &Size,
                    FixedPcdGet32(NumberOfUniverses);
                    );
  } else {
    DEBUG ((DEBUG_INFO, "[%a] - Hello world variable was found.\n", __FUNCTION__));
    DEBUG ((DEBUG_INFO, "[%a] - The number of parallel universes the UEFI Shell knows : %d\n", __FUNCTION__, NumberOfParallelUniverses));
  }

  return EFI_SUCCESS;
}