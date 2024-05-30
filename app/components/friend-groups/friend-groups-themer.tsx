'use client'

import {ProdeGroup} from "../../db/tables-definition";
import {Card, CardContent, CardHeader, TextField} from "@mui/material";
import {Controller, Form, useForm} from "react-hook-form";
import * as React from "react";
import {MuiColorInput} from "mui-color-input";
import {useState} from "react";
import {updateTheme} from "../../actions/prode-group-actions";
import {LoadingButton} from "@mui/lab";
import ImagePicker from "./image-picker";

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
  }

  return (
    <Card>
      <CardHeader title={'Customiza el look de tu grupo'}/>
      <CardContent>
        <form onSubmit={handleSubmit(onUpdateTheme)}>
          <Controller
            control={control}
            name={'primary_color'}
            render={({field, fieldState}) => (
              <MuiColorInput {...field} format="hex"/>
            )}
          />
          <Controller
            control={control}
            name={'secondary_color'}
            render={({field, fieldState}) => (
              <MuiColorInput {...field} format="hex"/>
            )}
          />
          <Controller
            control={control}
            name={'file'}
            render={({field, fieldState}) => (
              <ImagePicker {...field} id={'file'} label={'Logo'} defaultValue={group.theme?.logo}
                           onChange={(event) => {
                field.onChange(event.target.files[0]);
              }}/>
            )}
          />
          <LoadingButton loading={loading} type={'submit'}>Guardar Tema</LoadingButton>
        </form>
      </CardContent>
    </Card>
  )
}
