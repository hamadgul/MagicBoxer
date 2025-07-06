#ifdef __OBJC__
#import <UIKit/UIKit.h>
#else
#ifndef FOUNDATION_EXPORT
#if defined(__cplusplus)
#define FOUNDATION_EXPORT extern "C"
#else
#define FOUNDATION_EXPORT extern
#endif
#endif
#endif

#import "EXGLCameraObject.h"
#import "EXGLContext.h"
#import "EXGLObject.h"
#import "EXGLObjectManager.h"
#import "EXGLNativeApi.h"

FOUNDATION_EXPORT double ExpoGLVersionNumber;
FOUNDATION_EXPORT const unsigned char ExpoGLVersionString[];

