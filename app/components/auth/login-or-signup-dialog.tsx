'use client'


import {Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography} from "@mui/material";
import {Controller, SubmitHandler, useForm} from "react-hook-form";
//@ts-ignore
import validator from "validator";
import {LoadingButton} from "@mui/lab";
import * as React from "react";
import {useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {signIn, signOut} from "next-auth/react";
import {router} from "next/client";
import {signupUser} from "../../actions/user-actions";

type LoginOrSignupProps = {
  handleCloseLoginDialog: () => void;
  openLoginDialog: boolean
}

type FormData = {
  email?: string ,
  email_confirm?: string,
  nickname?: string,
  password?: string,
  password_confirm?:string
}
export default function LoginOrSignupDialog({ handleCloseLoginDialog, openLoginDialog }: LoginOrSignupProps) {
  const searchParams = useSearchParams();
  const [loginOrSignup, setLoginOrSignup] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const {
    control,
    handleSubmit,
    getValues,
    setError,
    formState: { errors }} = useForm<FormData>()
  const router = useRouter()


  const login:SubmitHandler<FormData>  = async (loginForm: FormData, e) => {
    e?.preventDefault()
    setLoading(true)
    try{
      const response: any = await signIn("credentials", {
        ...loginForm,
        redirect: false,
      });
      setLoading(false)

      if (!response.ok) {
        setError('root', {
          type: 'Login Error',
          message: 'Email o Contraseña Invalida'
        })
      } else {
        // Process response here
        handleCloseLoginDialog()
        router.push(searchParams?.get('callbackUrl') || '/')
        router.refresh();
      }
    } catch (error: any) {
      setError('root', {
        type: 'Server Error',
        message: error
      })
    }

  }

  const createUser:SubmitHandler<FormData>  = async (loginForm: FormData, e) => {
    e?.preventDefault()
    setLoading(true)
    if(loginForm.email && loginForm.password) {
      const userOrError: any = await signupUser({
        email: loginForm.email,
        password_hash: loginForm.password,
        nickname: loginForm.nickname
      });
      setLoading(false)

      if (typeof userOrError === 'string') {
        setError('root', {
          type: 'Login Error',
          message: userOrError
        })
      } else {
        // Process response here
        await login(loginForm);
      }
    }
  }


  return (
    <Dialog open={openLoginDialog} onClose={handleCloseLoginDialog}
      PaperProps={{
        //@ts-ignore
        component: 'form',
        onSubmit: handleSubmit(loginOrSignup === 'login' ? login: createUser)
      }}>
      <DialogTitle>{loginOrSignup === 'login' ? 'Ingresar' : 'Registrarse'}</DialogTitle>
      <DialogContent>
        {errors.root && (
          <Alert severity="error" variant='standard'>
            {errors.root.message}
          </Alert>
        )}
        <Controller
          control={control}
          name={'email'}
          rules={{
            required: 'Por favor ingrese su e-mail',
            validate: (value) => validator.isEmail(value) || 'Direccion de E-Mail invalida'
          }}
          render={({field, fieldState}) => (
            <TextField
              {...field}
              autoFocus
              margin="dense"
              label="E-Mail"
              type="text"
              fullWidth
              variant="standard"
              error={fieldState.error!== undefined}
              helperText={fieldState.error?.message || ''}
            />
          )}
        />
        {loginOrSignup === 'signup' && (
          <Controller
            control={control}
            name={'email_confirm'}
            rules={{
              required: 'Por favor confirme su e-mail',
              validate: (value) => value === getValues('email') || 'Confirme su e-mail correctamente'
            }}
            render={({field, fieldState}) => (
              <TextField
                {...field}
                autoFocus
                margin="dense"
                label="Confirmacion de E-Mail"
                type="text"
                fullWidth
                variant="standard"
                error={fieldState.error!== undefined}
                helperText={fieldState.error?.message || ''}
              />
            )}
          />
        )}
        {loginOrSignup === 'signup' && (
          <Controller
            control={control}
            name={'nickname'}
            render={({field}) => (
              <TextField
                {...field}
                autoFocus
                margin="dense"
                label="Apodo"
                type="text"
                fullWidth
                variant="standard"
              />
            )}
          />
        )}
        <Controller
          control={control}
          name={'password'}
          rules={{
            required: 'Cree su contraseña',
          }}
          render={({field, fieldState}) => (
            <TextField
              {...field}
              autoFocus
              margin="dense"
              label="Contraseña"
              type="password"
              fullWidth
              variant="standard"
              error={fieldState.error!== undefined}
              helperText={fieldState.error?.message || ''}
            />
          )}
        />
        {loginOrSignup === 'signup' && (
          <Controller
            control={control}
            name={'password_confirm'}
            rules={{
              required: 'Por favor confirme su contraseña',
              validate: (value) => value === getValues('password') || 'Confirme su contraseña correctamente'
            }}
            render={({field, fieldState}) => (
              <TextField
                {...field}
                autoFocus
                margin="dense"
                label="Confirmacion de Contraseña"
                type="password"
                fullWidth
                variant="standard"
                error={fieldState.error!== undefined}
                helperText={fieldState.error?.message || ''}
              />
            )}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button disabled={loading} onClick={handleCloseLoginDialog}>Cancelar</Button>
        <LoadingButton loading={loading} type='submit'>
          {loginOrSignup === 'login' ? 'Ingresar' : 'Registrarse'}
        </LoadingButton>
      </DialogActions>
      <DialogActions>
        {loginOrSignup === 'login' ? (
          <>No tenes usuario?&nbsp;<Typography color={'primary'} onClick={() => setLoginOrSignup('signup')}>Crea uno!</Typography></>
        ) : (
          <>Ya tenes usuario?&nbsp;<Typography color={'primary'} onClick={() => setLoginOrSignup('login')}>Ingresa aca!</Typography></>
        )}
      </DialogActions>
    </Dialog>
  )
}
