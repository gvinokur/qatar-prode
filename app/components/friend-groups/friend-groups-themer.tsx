'use client'

import {ProdeGroup} from "../../db/tables-definition";
import {Button, Card, CardActions, CardContent, CardHeader, TextField} from "@mui/material";
import {Controller, Form, useForm} from "react-hook-form";
import * as React from "react";
import {MuiColorInput} from "mui-color-input";
import {useState} from "react";
import {updateTheme} from "../../actions/prode-group-actions";
import ImagePicker from "./image-picker";
import {useRouter} from "next/navigation";
import {right} from "@popperjs/core";

type Props = {
  group: ProdeGroup
}

type FormData = {
  file?: File
  primary_color: string
  secondary_color: string
}

export default function ProdeGroupThemer({ group }: Props) {
  const [loading, setLoading] = useState<boolean>(false)
  const router = useRouter()
  const { handleSubmit, control } =
    useForm<FormData>({
      defaultValues: {
        primary_color: group.theme?.primary_color || '',
        secondary_color: group.theme?.secondary_color || '',
      }
    })

  const onUpdateTheme = async (form: FormData) => {
    const formData = new FormData()
    formData.append('primary_color', form.primary_color)
    formData.append('secondary_color', form.secondary_color)
    form.file && formData.append('logo', form.file)
    setLoading(true)
    await updateTheme(group.id, formData)
    setLoading(false)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader title={'Customiza el look de tu grupo'}/>
      <form onSubmit={handleSubmit(onUpdateTheme)}>
        <CardContent>

          <Controller
            control={control}
            name={'primary_color'}
            render={({field, fieldState}) => (
              <MuiColorInput {...field} format="hex" margin='dense' fullWidth autoFocus/>
            )}
          />
          <Controller
            control={control}
            name={'secondary_color'}
            render={({field, fieldState}) => (
              <MuiColorInput {...field} format="hex" margin='dense' fullWidth/>
            )}
          />
          <Controller
            control={control}
            name={'file'}
            render={({field, fieldState}) => (
              <ImagePicker {...field} id={'file'} defaultValue={group.theme?.logo}
                           onChange={(event) => {
                             console.log(event)
                             field.onChange(event.target.files?.[0]);
                           }}/>
            )}
          />

        </CardContent>
        <CardActions sx={{
          direction: 'rtl'
        }}>
          <Button variant={'contained'} loading={loading} type={'submit'}>Guardar Tema</Button>
        </CardActions>
      </form>

</Card>
)
}
